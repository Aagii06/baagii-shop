const router = require("express").Router();
const { carts, cartDetails, productVariants, products, sequelize } = require("../../models");
const { findCart, getOrCreateCart, detailInclude, toCartDetail, isSellable } = require("../../helper/cartHelper");
const { ok, fail, handle, now, toNumber } = require("../../helper/helper");

// Идэвхтэй сагс (вэб нэгийг нь ашиглана). Зарагдахаа больсон барааг автоматаар хасна.
const activeCarts = async (session) => {
  const cart = await findCart(session);
  if (!cart) return [];
  const details = await cartDetails.findAll({ where: { cart_id: cart.id }, include: detailInclude, order: [["id", "asc"]] });
  const sellable = [];
  for (const d of details) {
    if (isSellable(d)) sellable.push(d);
    else await d.destroy();
  }
  const lines = sellable.map(toCartDetail);
  return [
    {
      id: cart.id,
      qty: String(lines.reduce((sum, l) => sum + Number(l.qty), 0)),
      productCnt: lines.length,
      amount: lines.reduce((sum, l) => sum + Number(l.amount), 0).toFixed(2),
      cartTypeId: 1,
      cartStatusId: 1,
      cartDetails: lines,
    },
  ];
};

router.get(
  "/getActiveCarts",
  handle("activeCarts", async (req, res) => {
    const rows = await activeCarts(req.session);
    return ok(res, { rows, count: rows.length, summary: [] });
  }),
);

router.get(
  "/getCartsProductCnt",
  handle("cartsProductCnt", async (req, res) => {
    const [cart] = await activeCarts(req.session);
    return ok(res, cart ? Number(cart.qty) : 0);
  }),
);

// { postProductId (хувилбарын id), qty (шинэ нийт тоо, 0 бол хасна), cartDetailId? }
router.post(
  "/addProduct",
  handle("addProduct", async (req, res) => {
    const variantId = Number(req.body.postProductId);
    const qty = Math.floor(toNumber(req.body.qty));
    if (!variantId || qty < 0) return fail(res, "Бараа сонгоно уу");

    const t = await sequelize.transaction();
    try {
      const cart = await getOrCreateCart(req.session, t);
      const line = await cartDetails.findOne({ where: { cart_id: cart.id, variant_id: variantId }, transaction: t });
      if (qty === 0) {
        if (line) await line.destroy({ transaction: t });
        await t.commit();
        return ok(res, { id: line?.id ?? 0, cartId: cart.id, qty: "0" });
      }

      const variant = await productVariants.findOne({
        where: { id: variantId, status: "active" },
        include: [{ model: products, as: "product", where: { status: "active", is_active: true } }],
        transaction: t,
      });
      if (!variant) throw "Бараа олдсонгүй эсвэл зарагдахаа больсон байна";
      if (qty > variant.remain)
        throw variant.remain > 0 ? `Үлдэгдэл хүрэлцэхгүй байна (үлдэгдэл: ${variant.remain})` : "Бараа дууссан байна";

      const at = now();
      const saved = line
        ? await line.update({ qty, updated_at: at }, { transaction: t })
        : await cartDetails.create({ cart_id: cart.id, variant_id: variantId, qty, created_at: at }, { transaction: t });
      await cart.update({ updated_at: at }, { transaction: t });
      await t.commit();
      const detail = await cartDetails.findByPk(saved.id, { include: detailInclude });
      return ok(res, toCartDetail(detail));
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }),
);

// Сагсыг бүхэлд нь хоослоно (id нь cartId)
router.delete(
  "/:id",
  handle("deleteCart", async (req, res) => {
    const cart = await findCart(req.session);
    if (cart && cart.id === Number(req.params.id)) {
      await cartDetails.destroy({ where: { cart_id: cart.id } });
      await cart.update({ status: "deleted", updated_at: now() });
    }
    return ok(res, null);
  }),
);

module.exports = router;
