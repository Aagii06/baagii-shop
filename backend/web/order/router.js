const router = require("express").Router();
const { cartDetails, orders, sequelize } = require("../../models");
const { shopSettings, orderStatuses } = require("../../config/constants");
const { findCart, detailInclude, isActiveLine } = require("../../helper/cartHelper");
const { placeOrder, findOrder, toWebOrder, itemsInclude, restock } = require("../../helper/orderHelper");
const { orderKey } = require("../../helper/orderNumber");
const { notify, notifyOrderStaff } = require("../../helper/notificationHelper");
const { saveLog } = require("../../utils/logHelper");
const { sellingPrice } = require("../../helper/productHelper");
const { createInvoice, checkOrder, toWebInvoice, voidOrderInvoices } = require("../../helper/qpayHelper");
const { paymentSettings } = require("../../models");
const { ok, fail, handle, now, phoneDigits, isPhone, toNumber } = require("../../helper/helper");

// Утсаар нэвтэрсэн худалдан авагчийн захиалгууд (web/routes.js: requireCustomer)
router.get(
  "/",
  handle("myOrders", async (req, res) => {
    const rows = await orders.findAll({ where: { shop_id: req.shopId, customer_id: req.session.customerId }, include: itemsInclude, order: [["id", "desc"]] });
    return ok(res, { rows: rows.map(toWebOrder), count: rows.length, summary: [] });
  }),
);

router.get(
  "/:id",
  handle("myOrder", async (req, res) => {
    const order = await findOrder({ ...orderKey(req.params.id), shop_id: req.shopId, customer_id: req.session.customerId });
    if (!order) return fail(res, "Захиалга олдсонгүй");
    return ok(res, toWebOrder(order));
  }),
);

// Сагсаас захиалга үүсгэнэ: { shippingInfo, couponCode? }. Үнэ, хүргэлт (shippingInfo.deliveryMethod),
// хөнгөлөлтийг дэлгүүрийн тохиргоогоор (shopSettings) backend тооцно.
router.post(
  "/",
  handle("placeOrder", async (req, res) => {
    const { shippingInfo: s = {}, couponCode } = req.body;
    if (!String(s.fullName ?? "").trim()) return fail(res, "Хүлээн авагчийн нэр оруулна уу");
    if (!isPhone(s.phone)) return fail(res, "Утасны дугаар 8 оронтой байна");
    if (!String(s.address ?? "").trim()) return fail(res, "Хүргэлтийн хаяг оруулна уу");
    const { delivery, coupons } = shopSettings[req.shopId] ?? shopSettings[1];
    const method = s.deliveryMethod || "standard";
    if (!delivery[method]) return fail(res, "Хүргэлтийн сонголт буруу байна");
    const code = couponCode ? String(couponCode).trim().toUpperCase() : null;
    if (code && !coupons[code]) return fail(res, "Хөнгөлөлтийн код буруу байна");

    const t = await sequelize.transaction();
    try {
      const cart = await findCart(req.session, t);
      const lines = cart ? (await cartDetails.findAll({ where: { cart_id: cart.id }, include: detailInclude, transaction: t })).filter(isActiveLine) : [];
      if (lines.length === 0) throw "Сагс хоосон байна";
      const subtotal = lines.reduce((sum, l) => sum + sellingPrice(l.variant, l.variant.product) * l.qty, 0);
      const { fee, freeAbove } = delivery[method];

      const id = await placeOrder({
        shopId: req.shopId,
        lines: lines.map((l) => ({ variantId: l.variant_id, qty: l.qty })),
        info: {
          customer_id: req.session.customerId,
          source: "web",
          customer_name: s.fullName.trim(),
          phone: phoneDigits(s.phone),
          extra_phone: s.extraPhone ? phoneDigits(s.extraPhone) : null,
          email: s.email || null,
          address: s.address.trim(),
          address_label: s.addressLabel || null,
          address_type_id: s.addressTypeId || null,
          city_id: s.cityId || null,
          district_id: s.districtId || null,
          sub_district_id: s.subDistrictId || null,
          note: s.note || null,
          delivery_method: method,
          delivery_fee: freeAbove != null && subtotal >= freeAbove ? 0 : fee,
          coupon_code: code,
          coupon_amount: code ? coupons[code] : 0,
        },
        transaction: t,
      });
      await cartDetails.destroy({ where: { cart_id: cart.id }, transaction: t });
      await cart.update({ status: "ordered", updated_at: now() }, { transaction: t });
      await t.commit();
      const order = await findOrder({ id, shop_id: req.shopId });
      const web = toWebOrder(order);
      notify({
        shopId: req.shopId,
        type: "order",
        title: `Шинэ захиалга ${order.order_number}`,
        body: `${s.fullName.trim()} · ${lines.length} бараа · ₮${Math.round(subtotal).toLocaleString("en-US")}`,
        link: `/orders/${id}`,
      });
      return ok(res, web);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }),
);

// Дансаар шилжүүлэх: худалдан авагч шилжүүлснээ мэдэгдэнэ. Мөнгө орсныг админ шалгаж
// захиалгыг баталгаажуулахад (api/order setStatus → confirmed) төлөгдсөн болно.
router.post(
  "/:id/pay",
  handle("payOrder", async (req, res) => {
    if (req.body.paymentMethod !== "bank") return fail(res, "Төлбөрийн хэлбэр сонгоно уу");
    const s = await paymentSettings.findOne({ where: { shop_id: req.shopId } });
    if (!s?.bank_enabled) return fail(res, "Дансаар шилжүүлэх боломжгүй байна");
    const order = await findOrder({ ...orderKey(req.params.id), shop_id: req.shopId, customer_id: req.session.customerId });
    if (!order) return fail(res, "Захиалга олдсонгүй");
    if (order.status === orderStatuses.cancelled) return fail(res, "Захиалга цуцлагдсан байна");
    if (!order.paid_at) await order.update({ payment_method: "bank", updated_at: now() });
    return ok(res, toWebOrder(order));
  }),
);

// Худалдан авагч захиалгаа цуцлана — зөвхөн хүлээгдэж буй, төлбөр нь төлөгдөөгүй бол.
// Бараа үлдэгдэлд буцна; QPay нэхэмжлэх нь хүчингүй болно (төлөгдчихсөн байвал цуцлахгүй).
router.post(
  "/:id/cancel",
  handle("customerCancelOrder", async (req, res) => {
    const where = { ...orderKey(req.params.id), shop_id: req.shopId, customer_id: req.session.customerId };
    const found = await findOrder(where);
    if (!found) return fail(res, "Захиалга олдсонгүй");
    if (found.status !== orderStatuses.pending) return fail(res, "Зөвхөн хүлээгдэж буй захиалгыг цуцална");
    if (found.paid_at) return fail(res, "Төлбөр төлөгдсөн захиалгыг цуцлах боломжгүй");
    if (await voidOrderInvoices(req.shopId, found.id)) return fail(res, "Төлбөр төлөгдсөн тул цуцлах боломжгүй");

    const at = now();
    const t = await sequelize.transaction();
    try {
      // Гүйлгээн дотор дахин шалгана (энэ хооронд админ баталгаажуулсан байж болно)
      const order = await findOrder({ id: found.id, shop_id: req.shopId }, t);
      if (order.status !== orderStatuses.pending || order.paid_at) throw "Захиалгын төлөв өөрчлөгдсөн байна. Дахин шалгана уу";
      for (const item of order.items) {
        await restock(item.variant_id, item.qty - item.returned_qty, t);
        await item.update({ returned_qty: item.qty }, { transaction: t });
      }
      await order.update({ status: orderStatuses.cancelled, cancelled_at: at, updated_at: at }, { transaction: t });
      await saveLog({ shop_id: req.shopId, object_name: "orders", object_id: order.id, log_action: "cancelled", modify_data: JSON.stringify({ by: "customer" }), created_at: at }, t);
      await t.commit();
      notifyOrderStaff(order, "customerCancelled");
      return ok(res, toWebOrder(await findOrder({ id: order.id, shop_id: req.shopId })), "Захиалга цуцлагдлаа");
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }),
);

// QPay: нэхэмжлэх үүсгэж QR, банкны апп-ын холбоосыг буцаана
router.post(
  "/:id/qpay",
  handle("qpayInvoice", async (req, res) => {
    const order = await findOrder({ ...orderKey(req.params.id), shop_id: req.shopId, customer_id: req.session.customerId });
    if (!order) return fail(res, "Захиалга олдсонгүй");
    if (order.paid_at) return fail(res, "Захиалга төлөгдсөн байна");
    if (order.status === orderStatuses.cancelled) return fail(res, "Захиалга цуцлагдсан байна");
    return ok(res, toWebInvoice(await createInvoice(req.shopId, order)));
  }),
);

// QPay: төлөгдсөн эсэхийг шалгана (вэб хэдэн секунд тутам дуудна)
router.get(
  "/:id/qpay",
  handle("qpayCheck", async (req, res) => {
    const order = await findOrder({ ...orderKey(req.params.id), shop_id: req.shopId, customer_id: req.session.customerId });
    if (!order) return fail(res, "Захиалга олдсонгүй");
    return ok(res, toWebOrder(order.paid_at ? order : await checkOrder(req.shopId, order.id)));
  }),
);

module.exports = router;
