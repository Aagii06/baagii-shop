const { orders, orderItems, products, productVariants, sequelize } = require("../models");
const { orderStatuses } = require("../config/constants");
const { toIso, toNumber, now } = require("./helper");
const { variantImage } = require("./productHelper");
const { saveLog } = require("../utils/logHelper");

module.exports.itemsInclude = [{ model: orderItems, as: "items" }];

const kept = (item) => item.qty - (item.returned_qty || 0);
const subtotalOf = (order) => (order.items ?? []).reduce((sum, item) => sum + kept(item) * toNumber(item.price), 0);
module.exports.revenueOf = (order) =>
  order.status === orderStatuses.returned ? 0 : subtotalOf(order) + toNumber(order.delivery_fee) - toNumber(order.coupon_amount);

// admin/src/lib/api/orders.ts-ийн Order
module.exports.toAdminOrder = (order) => ({
  id: order.id,
  status: order.status,
  createdAt: toIso(order.created_at),
  customer: { name: order.customer_name ?? "", phone: order.phone ?? "", address: order.address ?? "" },
  items: [...(order.items ?? [])]
    .sort((a, b) => a.id - b.id)
    .map((item) => ({
      id: item.id,
      name: item.name,
      image: item.image,
      qty: item.qty,
      price: toNumber(item.price),
      ...(item.returned_qty ? { returnedQty: item.returned_qty } : {}),
    })),
  deliveryFee: toNumber(order.delivery_fee),
  timeline: Object.fromEntries(
    [
      ["pending", order.created_at],
      ["confirmed", order.confirmed_at],
      ["delivered", order.delivered_at],
      ["returned", order.returned_at],
    ]
      .filter(([, at]) => at)
      .map(([status, at]) => [status, toIso(at)]),
  ),
  paymentMethod: order.payment_method,
  paidAt: toIso(order.paid_at),
});

// Вэбийн захиалга (web/src/types/order.ts). Зургийг вэб өөрөө URL болгоно.
module.exports.toWebOrder = (order) => {
  const subtotal = (order.items ?? []).reduce((sum, item) => sum + item.qty * toNumber(item.price), 0);
  const shipping = toNumber(order.delivery_fee);
  const coupon = toNumber(order.coupon_amount);
  return {
    id: String(order.id),
    status: order.status,
    paymentMethod: order.payment_method,
    paidAt: toIso(order.paid_at),
    createdAt: toIso(order.created_at),
    items: [...(order.items ?? [])]
      .sort((a, b) => a.id - b.id)
      .map((item) => ({ id: item.product_id, variantId: item.variant_id, name: item.name, price: toNumber(item.price), image: item.image, quantity: item.qty })),
    shippingInfo: {
      addressLabel: order.address_label ?? "",
      address: order.address ?? "",
      addressTypeId: order.address_type_id ?? undefined,
      cityId: order.city_id ?? undefined,
      districtId: order.district_id ?? undefined,
      subDistrictId: order.sub_district_id ?? undefined,
      fullName: order.customer_name ?? "",
      phone: order.phone ?? "",
      extraPhone: order.extra_phone ?? undefined,
      email: order.email ?? undefined,
      note: order.note ?? undefined,
      deliveryMethod: "standard",
      deliveryFee: shipping,
    },
    subtotal,
    shipping,
    coupon,
    total: Math.max(0, subtotal + shipping - coupon),
  };
};

/**
 * Захиалга үүсгэж, хувилбаруудын үлдэгдлийг хасна. Бараа нь shopId дэлгүүрийнх байх ёстой.
 * lines - [{ variantId, qty, price? }]; price өгөөгүй бол барааны одоогийн үнэ.
 * info  - orders хүснэгтийн багана (customer_name, phone, address, …)
 */
module.exports.placeOrder = async ({ shopId, lines, info, by = null, transaction }) => {
  const t = transaction ?? (await sequelize.transaction());
  try {
    const merged = new Map();
    for (const line of lines) {
      const qty = Math.floor(toNumber(line.qty));
      if (qty <= 0) continue;
      const prev = merged.get(Number(line.variantId));
      merged.set(Number(line.variantId), { ...line, qty: (prev?.qty ?? 0) + qty });
    }
    if (merged.size === 0) throw "Захиалгад бараа нэмнэ үү";

    const at = now();
    const items = [];
    for (const [variantId, line] of merged) {
      const variant = await productVariants.findOne({
        where: { id: variantId, status: "active" },
        include: [{ model: products, as: "product", where: { shop_id: shopId, status: "active" } }],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!variant) throw "Захиалсан бараа олдсонгүй эсвэл устгагдсан байна";
      const name = variant.name && variant.name !== variant.product.name ? `${variant.product.name} · ${variant.name}` : variant.product.name;
      if (variant.remain < line.qty) throw `"${name}" барааны үлдэгдэл хүрэлцэхгүй байна (үлдэгдэл: ${variant.remain})`;
      await variant.update({ remain: variant.remain - line.qty }, { transaction: t });
      items.push({
        product_id: variant.product_id,
        variant_id: variant.id,
        name,
        image: variantImage(variant.product.attrs ?? [], variant) ?? variant.product.images?.[0] ?? null,
        qty: line.qty,
        price: line.price != null ? toNumber(line.price) : toNumber(variant.price),
        returned_qty: 0,
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
    const order = await orders.create(
      { ...info, shop_id: shopId, subtotal, status: orderStatuses.pending, created_by: by, created_at: at },
      { transaction: t },
    );
    await orderItems.bulkCreate(items.map((item) => ({ ...item, order_id: order.id })), { transaction: t });
    await saveLog({ shop_id: shopId, object_name: "orders", object_id: order.id, log_action: "created", modify_data: JSON.stringify({ lines, info }), created_by: by, created_at: at }, t);

    if (!transaction) await t.commit();
    return order.id;
  } catch (error) {
    if (!transaction) await t.rollback();
    throw error;
  }
};

// Буцаасан тоог үлдэгдэлд нэмнэ
module.exports.restock = async (variantId, qty, t) => {
  if (!variantId || qty <= 0) return;
  await productVariants.increment({ remain: qty }, { where: { id: variantId }, transaction: t });
};

// where-д shop_id заавал өгнө
module.exports.findOrder = (where, t) => orders.findOne({ where, include: module.exports.itemsInclude, transaction: t });
