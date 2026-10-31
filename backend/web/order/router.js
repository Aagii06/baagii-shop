const router = require("express").Router();
const { cartDetails, orders, sequelize } = require("../../models");
const { shopSettings, paymentMethods } = require("../../config/constants");
const { findCart, detailInclude, isSellable } = require("../../helper/cartHelper");
const { placeOrder, findOrder, toWebOrder, itemsInclude } = require("../../helper/orderHelper");
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
    const order = await findOrder({ id: req.params.id, shop_id: req.shopId, customer_id: req.session.customerId });
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
      const lines = cart ? (await cartDetails.findAll({ where: { cart_id: cart.id }, include: detailInclude, transaction: t })).filter(isSellable) : [];
      if (lines.length === 0) throw "Сагс хоосон байна";
      const subtotal = lines.reduce((sum, l) => sum + toNumber(l.variant.price) * l.qty, 0);
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
      return ok(res, toWebOrder(await findOrder({ id, shop_id: req.shopId })));
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }),
);

// Төлбөр: одоохондоо төлбөрийн сервисгүй тул сонгосон аргаар төлсөн гэж тэмдэглэнэ
router.post(
  "/:id/pay",
  handle("payOrder", async (req, res) => {
    const { paymentMethod } = req.body;
    if (!paymentMethods.includes(paymentMethod)) return fail(res, "Төлбөрийн хэлбэр сонгоно уу");
    const order = await findOrder({ id: req.params.id, shop_id: req.shopId, customer_id: req.session.customerId });
    if (!order) return fail(res, "Захиалга олдсонгүй");
    if (!order.paid_at) await order.update({ payment_method: paymentMethod, paid_at: now(), updated_at: now() });
    return ok(res, toWebOrder(order));
  }),
);

module.exports = router;
