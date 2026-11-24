const moment = require("moment");
const { notifications, sequelize, op } = require("../models");
const { FORMAT, toNumber } = require("./helper");
const { notify } = require("./notificationHelper");

// Долоо хоногт нэг удаа (Даваа гараг 09:00-ээс хойш, Улаанбаатарын цагаар) админд сануулна:
// хэдэн дэлгүүрт хэдэн төгрөгийн тооцоо хийгдээгүй байгааг (api/storeReport). Энэ долоо хоногт
// аль хэдийн илгээсэн бол (notifications-д settlement_due) дахин илгээхгүй.
const TYPE = "settlement_due";

module.exports.scanWeeklySettlement = async () => {
  try {
    const now = moment().utcOffset("+0800");
    if (now.isoWeekday() !== 1 || now.hour() < 9) return;
    const weekStart = now.clone().startOf("isoWeek").format(FORMAT);
    const [rows] = await sequelize.query(
      `SELECT o.shop_id, COUNT(DISTINCT oi.store_id) AS stores,
              SUM((oi.qty - oi.returned_qty - oi.settled_qty) * oi.price) AS amount
         FROM orderItems oi JOIN orders o ON o.id = oi.order_id
        WHERE o.status = 'delivered' AND oi.store_id IS NOT NULL AND oi.qty - oi.returned_qty - oi.settled_qty <> 0
        GROUP BY o.shop_id`,
    );
    for (const row of rows) {
      const amount = toNumber(row.amount);
      if (amount <= 0) continue;
      const sent = await notifications.count({ where: { shop_id: row.shop_id, type: TYPE, created_at: { [op.gte]: weekStart } } });
      if (sent) continue;
      await notify({
        shopId: row.shop_id,
        type: TYPE,
        title: "7 хоногийн тооцоо хийх өдөр",
        body: `${row.stores} дэлгүүрт нийт ₮${Math.round(amount).toLocaleString("en-US")} шилжүүлэх`,
        link: "/store-sales",
      });
    }
  } catch (error) {
    console.error("scanWeeklySettlement failed:", error);
  }
};
