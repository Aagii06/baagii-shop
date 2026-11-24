const moment = require("moment");
const { Op } = require("sequelize");
const { orders, sequelize } = require("../models");
const { orderStatuses, unpaidCancelHours } = require("../config/constants");
const { findOrder, restock } = require("./orderHelper");
const { voidOrderInvoices } = require("./qpayHelper");
const { notifyOrderCustomer, notifyOrderStaff } = require("./notificationHelper");
const { saveLog } = require("../utils/logHelper");
const { now, FORMAT } = require("./helper");

/**
 * unpaidCancelHours (3 цаг) өнгөрсөн, төлөгдөөгүй, хүлээгдэж буй захиалгыг автоматаар цуцалж,
 * бараа бүрийг үлдэгдэлд буцаана (server.js 5 минут тутам дуудна).
 *  - QPay нэхэмжлэх төлөгдсөн байвал цуцлахгүй (тэр нь баталгаажна).
 *  - "Дансаар шилжүүлсэн" (payment_method = bank) захиалгыг цуцлахгүй: мөнгө нь орсон ч
 *    админ хараахан шалгаагүй байж болно — админд сануулга очно (scanOverdueOrders).
 */
module.exports.autoCancelUnpaidOrders = async () => {
  try {
    const cutoff = moment().utcOffset("+0800").subtract(unpaidCancelHours, "hours").format(FORMAT);
    const rows = await orders.findAll({
      where: {
        status: orderStatuses.pending,
        paid_at: null,
        created_at: { [Op.lte]: cutoff },
        [Op.or]: [{ payment_method: null }, { payment_method: { [Op.ne]: "bank" } }],
      },
      attributes: ["id", "shop_id"],
      raw: true,
    });
    for (const row of rows) {
      try {
        if (await voidOrderInvoices(row.shop_id, row.id)) continue;
        const at = now();
        const t = await sequelize.transaction();
        let order;
        try {
          order = await findOrder({ id: row.id, shop_id: row.shop_id }, t);
          // Энэ хооронд төлөгдсөн / баталгаажсан / цуцлагдсан бол алгасна
          if (!order || order.status !== orderStatuses.pending || order.paid_at || order.payment_method === "bank") {
            await t.rollback();
            continue;
          }
          for (const item of order.items) {
            await restock(item.variant_id, item.qty - item.returned_qty, t);
            await item.update({ returned_qty: item.qty }, { transaction: t });
          }
          await order.update({ status: orderStatuses.cancelled, cancelled_at: at, updated_at: at }, { transaction: t });
          await saveLog(
            { shop_id: row.shop_id, object_name: "orders", object_id: order.id, log_action: "cancelled", modify_data: JSON.stringify({ by: "auto", hours: unpaidCancelHours }), created_at: at },
            t,
          );
          await t.commit();
        } catch (error) {
          await t.rollback();
          throw error;
        }
        notifyOrderCustomer(order, "cancelled");
        notifyOrderStaff(order, "cancelled");
      } catch (error) {
        console.error("autoCancelUnpaidOrders order", row.id, "failed:", error);
      }
    }
  } catch (error) {
    console.error("autoCancelUnpaidOrders failed:", error);
  }
};
