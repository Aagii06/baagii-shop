const moment = require("moment");
const { stores, storeSettlements, storeSettlementItems, orderItems, sequelize } = require("../../models");
const { saveLog } = require("../../utils/logHelper");
const { ok, fail, handle, toNumber, toIso, FORMAT } = require("../../helper/helper");
const { notify } = require("../../helper/notificationHelper");

// Дэлгүүрийн (худалдагчийн) борлуулалт. Захиалгын мөр бүр захиалах үеийн дэлгүүртэйгээ
// (orderItems.store_id) — үндсэн дэлгүүрийн өөрийн бараа (null) энд орохгүй.
//   delivered — хүргэгдсэн захиалгын буцаагдаагүй бараа: худалдагчид олгох мөнгө
//   pending   — хүлээгдэж буй / баталгаажсан захиалгынх: хүргэгдвэл олгох болно
// Цуцлагдсан захиалга тоологдохгүй; буцаасан тоо (returned_qty) хасагдана.
// Хугацаа (?from=&to=, YYYY-MM-DD, хоёулаа орно) нь захиалга үүссэн өдрөөр шүүнэ.
// Тооцоо мөрөөр: orderItems.settled_qty — мөнгийг нь шилжүүлсэн ширхэг. Олгох үлдэгдэл (balance) нь
// хугацаанаас үл хамааран хүргэгдсэн захиалгын (qty − returned_qty − settled_qty) × price-ийн нийлбэр
// (тооцооны дараа буцаасан бол сөрөг мөр болж хасагдана). Долоо хоногт нэг удаа "settle" хийнэ.

const DAY = "YYYY-MM-DD";
const range = (q) => {
  const from = moment(q.from, DAY, true);
  const to = moment(q.to, DAY, true);
  return {
    from: from.isValid() ? from.format(FORMAT) : null,
    to: to.isValid() ? to.add(1, "day").format(FORMAT) : null,
  };
};

// Дэлгүүр тус бүрийн дүн; storeId өгвөл тэр дэлгүүрийнх л
const salesByStore = async (shopId, { from, to, storeId = null }) => {
  const [rows] = await sequelize.query(
    `SELECT oi.store_id,
            COUNT(DISTINCT o.id) AS orders,
            SUM(CASE WHEN o.status = 'delivered' THEN oi.qty - oi.returned_qty ELSE 0 END) AS delivered_qty,
            SUM(CASE WHEN o.status = 'delivered' THEN (oi.qty - oi.returned_qty) * oi.price ELSE 0 END) AS delivered,
            SUM(CASE WHEN o.status IN ('pending', 'confirmed') THEN (oi.qty - oi.returned_qty) * oi.price ELSE 0 END) AS pending,
            SUM(CASE WHEN o.status = 'delivered' THEN (oi.qty - oi.returned_qty - oi.settled_qty) * oi.price ELSE 0 END) AS unsettled
       FROM orderItems oi
       JOIN orders o ON o.id = oi.order_id
      WHERE o.shop_id = :shopId AND o.status <> 'cancelled' AND oi.store_id IS NOT NULL
        AND (oi.qty > oi.returned_qty OR oi.settled_qty > 0)
        ${from ? "AND o.created_at >= :from" : ""} ${to ? "AND o.created_at < :to" : ""}
        ${storeId ? "AND oi.store_id = :storeId" : ""}
      GROUP BY oi.store_id`,
    { replacements: { shopId, from, to, storeId } },
  );
  return new Map(rows.map((r) => [r.store_id, r]));
};

const settledByStore = async (shopId) => {
  const rows = await storeSettlements.findAll({
    attributes: ["store_id", [sequelize.fn("SUM", sequelize.col("amount")), "total"]],
    where: { shop_id: shopId },
    group: ["store_id"],
    raw: true,
  });
  return new Map(rows.map((r) => [r.store_id, toNumber(r.total)]));
};

const summaryOf = (store, sales, allTime, settled) => ({
  storeId: store.id,
  storeName: store.name,
  logo: store.logo ?? null,
  orders: Number(sales?.orders ?? 0),
  deliveredQty: Number(sales?.delivered_qty ?? 0),
  delivered: toNumber(sales?.delivered),
  pending: toNumber(sales?.pending),
  settled: settled ?? 0,
  balance: toNumber(allTime?.unsettled),
});

// GET /storeReport?from=&to= — бүх дэлгүүр, үлдэгдэл ихтэй нь эхэндээ
module.exports.list = handle("storeReport", async (req, res) => {
  const period = range(req.query);
  const [list, sales, allTime, settled] = await Promise.all([
    stores.findAll({ where: { shop_id: req.shopId, status: "active" }, attributes: ["id", "name", "logo"], raw: true }),
    salesByStore(req.shopId, period),
    salesByStore(req.shopId, {}),
    settledByStore(req.shopId),
  ]);
  const rows = list
    .map((s) => summaryOf(s, sales.get(s.id), allTime.get(s.id), settled.get(s.id)))
    .sort((a, b) => b.balance - a.balance || b.delivered - a.delivered || a.storeName.localeCompare(b.storeName));
  const total = rows.reduce(
    (t, r) => ({ delivered: t.delivered + r.delivered, pending: t.pending + r.pending, balance: t.balance + r.balance }),
    { delivered: 0, pending: 0, balance: 0 },
  );
  return ok(res, { rows, total });
});

// Тооцоо хийгдээгүй мөрүүд: хүргэгдсэн захиалгын (qty − returned − settled) ≠ 0. Сөрөг —
// тооцооны дараа буцаасан (дараагийн тооцооноос хасна). lock — шилжүүлэхэд гүйлгээн дотор түгжинэ.
const unsettledLines = (shopId, storeId, transaction) =>
  orderItems.findAll({
    where: sequelize.literal(
      `orderItems.store_id = ${Number(storeId)} AND orderItems.qty - orderItems.returned_qty - orderItems.settled_qty <> 0 AND EXISTS (SELECT 1 FROM orders o WHERE o.id = orderItems.order_id AND o.shop_id = ${Number(shopId)} AND o.status = 'delivered')`,
    ),
    order: [["order_id", "asc"], ["id", "asc"]],
    transaction,
    ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
  });

// Мөрүүдийг бараа (хувилбар) бүрээр нэгтгэнэ — qty нь тооцоо хийгдээгүй ширхэг
const groupByItem = (lines, qtyOf) => {
  const map = new Map();
  for (const l of lines) {
    const qty = qtyOf(l);
    const key = `${l.variant_id ?? ""}|${l.name}`;
    const row = map.get(key) ?? { productId: l.product_id, variantId: l.variant_id, name: l.name, image: l.image, orders: new Set(), qty: 0, amount: 0 };
    row.orders.add(l.order_id);
    row.qty += qty;
    row.amount += qty * toNumber(l.price);
    map.set(key, row);
  }
  return [...map.values()]
    .map((r) => ({ ...r, orders: r.orders.size }))
    .sort((a, b) => b.qty - a.qty || b.amount - a.amount || a.name.localeCompare(b.name));
};

// GET /storeReport/:storeId — нийт тооцоо, тооцоо хийгдээгүй бараа (бараагаар, захиалгаар),
// хүргэгдээгүй захиалгын бараа, тооцооны түүх
module.exports.show = handle("storeReportShow", async (req, res) => {
  const store = await stores.findOne({ where: { id: req.params.storeId, shop_id: req.shopId }, attributes: ["id", "name", "logo"], raw: true });
  if (!store) return fail(res, "Дэлгүүр олдсонгүй");
  const [allTime, settled, lines] = await Promise.all([
    salesByStore(req.shopId, { storeId: store.id }),
    settledByStore(req.shopId),
    unsettledLines(req.shopId, store.id),
  ]);
  const unsettledQty = (l) => l.qty - l.returned_qty - l.settled_qty;

  const orderIds = [...new Set(lines.map((l) => l.order_id))];
  const [orderRows] = orderIds.length
    ? await sequelize.query("SELECT id, order_number, delivered_at FROM orders WHERE id IN (:ids)", { replacements: { ids: orderIds } })
    : [[]];
  const orderInfo = new Map(orderRows.map((o) => [o.id, o]));
  const orders = orderIds.map((id) => {
    const own = lines.filter((l) => l.order_id === id);
    const info = orderInfo.get(id);
    return {
      id,
      orderNumber: info?.order_number ?? `#${id}`,
      deliveredAt: toIso(info?.delivered_at),
      amount: own.reduce((sum, l) => sum + unsettledQty(l) * toNumber(l.price), 0),
      items: own.map((l) => ({ id: l.id, name: l.name, image: l.image, qty: unsettledQty(l), price: toNumber(l.price) })),
    };
  });

  // Хүргэгдээгүй (хүлээгдэж буй / баталгаажсан) — хүргэгдвэл тооцоонд орно
  const [pendingLines] = await sequelize.query(
    `SELECT oi.order_id, oi.product_id, oi.variant_id, oi.name, oi.image, oi.qty, oi.returned_qty, oi.price
       FROM orderItems oi JOIN orders o ON o.id = oi.order_id
      WHERE o.shop_id = :shopId AND oi.store_id = :storeId AND o.status IN ('pending', 'confirmed') AND oi.qty > oi.returned_qty`,
    { replacements: { shopId: req.shopId, storeId: store.id } },
  );

  const settlements = await storeSettlements.findAll({ where: { shop_id: req.shopId, store_id: store.id }, order: [["id", "desc"]], raw: true });
  const settlementItems = settlements.length
    ? await storeSettlementItems.findAll({ where: { settlement_id: settlements.map((x) => x.id) }, raw: true })
    : [];

  return ok(res, {
    ...summaryOf(store, null, allTime.get(store.id), settled.get(store.id)),
    allTime: { delivered: toNumber(allTime.get(store.id)?.delivered), pending: toNumber(allTime.get(store.id)?.pending) },
    unsettled: { items: groupByItem(lines, unsettledQty), orders },
    pending: groupByItem(pendingLines, (l) => l.qty - l.returned_qty),
    settlements: settlements.map((x) => {
      const items = settlementItems.filter((i) => i.settlement_id === x.id);
      return {
        id: x.id,
        amount: toNumber(x.amount),
        note: x.note,
        createdAt: toIso(x.created_at),
        orders: new Set(items.map((i) => i.order_id)).size,
        qty: items.reduce((sum, i) => sum + i.qty, 0),
      };
    }),
  });
});

// POST /storeReport/:storeId/settle { expected, note? } — тооцоо хийгдээгүй бүх мөрийг шилжүүлснээр
// тэмдэглэнэ. expected — админы харсан дүн; хооронд өөрчлөгдсөн бол (шинэ хүргэлт, буцаалт) татгалзана.
module.exports.settle = handle("storeSettle", async (req, res) => {
  const { expected, note, by, at } = req.body;
  const store = await stores.findOne({ where: { id: req.params.storeId, shop_id: req.shopId }, attributes: ["id", "name"], raw: true });
  if (!store) return fail(res, "Дэлгүүр олдсонгүй");
  const t = await sequelize.transaction();
  try {
    const lines = await unsettledLines(req.shopId, store.id, t);
    const amount = lines.reduce((sum, l) => sum + (l.qty - l.returned_qty - l.settled_qty) * toNumber(l.price), 0);
    if (lines.length === 0 || amount <= 0) throw "Тооцоо хийх бараа алга";
    if (expected != null && Math.abs(toNumber(expected) - amount) > 0.01)
      throw "Тооцоо өөрчлөгдсөн байна (шинэ хүргэлт эсвэл буцаалт). Хуудсаа дахин ачаалаад шалгана уу";
    const row = await storeSettlements.create(
      { shop_id: req.shopId, store_id: store.id, amount, note: String(note ?? "").trim().slice(0, 500) || null, created_by: by, created_at: at },
      { transaction: t },
    );
    await storeSettlementItems.bulkCreate(
      lines.map((l) => ({ settlement_id: row.id, order_item_id: l.id, order_id: l.order_id, name: l.name, qty: l.qty - l.returned_qty - l.settled_qty, price: l.price })),
      { transaction: t },
    );
    for (const l of lines) await l.update({ settled_qty: l.qty - l.returned_qty }, { transaction: t });
    await saveLog({ shop_id: req.shopId, object_name: "storeSettlements", object_id: row.id, log_action: "created", modify_data: JSON.stringify({ storeId: store.id, amount, lines: lines.length }), created_by: by, created_at: at }, t);
    await t.commit();
    // Худалдагчид: мөнгө шилжүүлсэн
    notify({
      shopId: req.shopId,
      storeId: store.id,
      admins: false,
      type: "order_paid",
      title: `Тооцоо шилжүүллээ: ₮${Math.round(amount).toLocaleString("en-US")}`,
      body: `${lines.length} бараа${row.note ? ` · ${row.note}` : ""}`,
      shopperLink: "/products",
    });
    return ok(res, { id: row.id, amount });
  } catch (error) {
    await t.rollback();
    throw error;
  }
});
