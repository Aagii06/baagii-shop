const { carts, cartDetails, productVariants, products, op } = require("../models");
const { defaultBranch, cartLineTtlMinutes } = require("../config/constants");
const { toNumber, now, parseAt } = require("./helper");
const { variantImage, sellingPrice } = require("./productHelper");

// Сагс: утсаар нэвтэрсэн бол customer_id-аар, үгүй бол зочны guest_id-аар хайна (дэлгүүр бүрт тусдаа)
const ownerWhere = ({ shopId, guestId, customerId }) =>
  customerId ? { shop_id: shopId, customer_id: customerId } : { shop_id: shopId, guest_id: guestId, customer_id: null };

module.exports.findCart = (session, t) =>
  carts.findOne({ where: { ...ownerWhere(session), status: "active" }, order: [["id", "desc"]], transaction: t });

module.exports.getOrCreateCart = async (session, t) =>
  (await module.exports.findCart(session, t)) ??
  carts.create({ shop_id: session.shopId, guest_id: session.guestId, customer_id: session.customerId, status: "active", created_at: now() }, { transaction: t });

const detailInclude = [
  { model: productVariants, as: "variant", include: [{ model: products, as: "product" }] },
];
module.exports.detailInclude = detailInclude;

// Сагсны мөр нэмэгдсэнээс (created_at) хойш cartLineTtlMinutes болоход хугацаа нь дуусна.
// Тоо ширхгийг өөрчлөхөд хугацаа шинэчлэгдэхгүй.
const TTL_MS = cartLineTtlMinutes * 60 * 1000;
const expiresInSec = (detail) => {
  if (!detail.created_at) return Math.round(TTL_MS / 1000);
  return Math.max(0, Math.floor((parseAt(detail.created_at).valueOf() + TTL_MS - Date.now()) / 1000));
};
module.exports.isExpired = (detail) => expiresInSec(detail) <= 0;

// web/src/lib/api/cart.ts-ийн ApiCartDetail. Үнэ нь барааны одоогийн үнэ (хямдралын хугацааг тооцно).
module.exports.toCartDetail = (detail) => {
  const variant = detail.variant;
  const product = variant?.product;
  const price = sellingPrice(variant, product);
  return {
    id: detail.id,
    cartId: detail.cart_id,
    branchId: defaultBranch.id,
    postId: product?.id ?? null,
    postProductId: variant?.id ?? null,
    productId: product?.id ?? 0,
    productCode: "",
    productName: product?.name ?? "",
    variantId: variant?.id ?? 0,
    variantCode: variant?.code ?? "",
    variantName: variant?.name && variant.name !== product?.name ? `${product.name} · ${variant.name}` : product?.name ?? "",
    image: (product && variantImage(product.attrs ?? [], variant)) ?? product?.images?.[0] ?? null,
    price: price.toFixed(2),
    qty: String(detail.qty),
    amount: (price * detail.qty).toFixed(2),
    // Хэдэн секундын дараа сагснаас хасагдах (вэб тоолуур харуулна)
    expiresIn: expiresInSec(detail),
  };
};

// Зарагдахгүй болсон (устгасан / нуусан) барааг сагснаас хасна
module.exports.isSellable = (detail) =>
  detail.variant?.status === "active" && detail.variant.product?.status === "active" && detail.variant.product.is_active;

// Сагсанд үлдэх мөр: зарагдаж буй, хугацаа нь дуусаагүй
module.exports.isActiveLine = (detail) => module.exports.isSellable(detail) && !module.exports.isExpired(detail);

// Утсаар нэвтрэхэд зочны сагсыг худалдан авагчийнх руу нийлүүлнэ
module.exports.mergeGuestCart = async (shopId, guestId, customerId, t) => {
  const guest = await module.exports.findCart({ shopId, guestId, customerId: null }, t);
  if (!guest) return;
  const own = await module.exports.findCart({ shopId, guestId, customerId }, t);
  if (!own) {
    await guest.update({ customer_id: customerId, updated_at: now() }, { transaction: t });
    return;
  }
  const lines = await cartDetails.findAll({ where: { cart_id: guest.id }, transaction: t });
  for (const line of lines) {
    const same = await cartDetails.findOne({ where: { cart_id: own.id, variant_id: line.variant_id }, transaction: t });
    if (same) {
      await same.update({ qty: same.qty + line.qty, updated_at: now() }, { transaction: t });
      await line.destroy({ transaction: t });
    } else {
      await line.update({ cart_id: own.id }, { transaction: t });
    }
  }
  await guest.update({ status: "deleted", updated_at: now() }, { transaction: t });
};

module.exports.op = op;
