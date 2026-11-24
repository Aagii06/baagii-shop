const moment = require("moment");
const { stores, storeSettlements, sequelize } = require("../../models");
const { saveLog } = require("../../utils/logHelper");
const { ok, fail, handle, toNumber, toIso, FORMAT } = require("../../helper/helper");

// Дэлгүүрийн (худалдагчийн) борлуулалт. Захиалгын мөр бүр захиалах үеийн дэлгүүртэйгээ
// (orderItems.store_id) — үндсэн дэлгүүрийн өөрийн бараа (null) энд орохгүй.
//   delivered — хүргэгдсэн захиалгын буцаагдаагүй бараа: худалдагчид олгох мөнгө
//   pending   — хүлээгдэж буй / баталгаажсан захиалгынх: хүргэгдвэл олгох болно
// Цуцлагдсан захиалга тоологдохгүй; буцаасан тоо (returned_qty) хасагдана.
// Хугацаа (?from=&to=, YYYY-MM-DD, хоёулаа орно) нь захиалга үүссэн өдрөөр шүүнэ.
// Олгох үлдэгдэл (balance) хугацаанаас үл хамааран: бүх хугацааны delivered − шилжүүлсэн нийт дүн.

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
            SUM(CASE WHEN o.status IN ('pending', 'confirmed') THEN (oi.qty - oi.returned_qty) * oi.price ELSE 0 END) AS pending
       FROM orderItems oi
       JOIN orders o ON o.id = oi.order_id
      WHERE o.shop_id = :shopId AND o.status <> 'cancelled' AND oi.store_id IS NOT NULL
        AND oi.qty > oi.returned_qty
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
  balance: toNumber(allTime?.delivered) - (settled ?? 0),
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

// GET /storeReport/:storeId?from=&to= — дүн, захиалга бүрээр (зөвхөн тэр дэлгүүрийн бараа), тооцооны түүх
module.exports.show = handle("storeReportShow", async (req, res) => {
  const store = await stores.findOne({ where: { id: req.params.storeId, shop_id: req.shopId }, attributes: ["id", "name", "logo"], raw: true });
  if (!store) return fail(res, "Дэлгүүр олдсонгүй");
  const period = range(req.query);
  const [sales, allTime, settled] = await Promise.all([
    salesByStore(req.shopId, { ...period, storeId: store.id }),
    salesByStore(req.shopId, { storeId: store.id }),
    settledByStore(req.shopId),
  ]);
  const [lines] = await sequelize.query(
    `SELECT o.id AS order_id, o.order_number, o.status, o.created_at, o.delivered_at,
            oi.id, oi.product_id, oi.variant_id, oi.name, oi.image, oi.qty, oi.returned_qty, oi.price
       FROM orderItems oi
       JOIN orders o ON o.id = oi.order_id
      WHERE o.shop_id = :shopId AND oi.store_id = :storeId AND o.status <> 'cancelled'
        ${period.from ? "AND o.created_at >= :from" : ""} ${period.to ? "AND o.created_at < :to" : ""}
      ORDER BY o.id DESC, oi.id`,
    { replacements: { shopId: req.shopId, storeId: store.id, ...period } },
  );
  const orders = [];
  for (const l of lines) {
    let o = orders[orders.length - 1];
    if (!o || o.id !== l.order_id) {
      o = { id: l.order_id, orderNumber: l.order_number ?? `#${l.order_id}`, status: l.status, createdAt: toIso(l.created_at), deliveredAt: toIso(l.delivered_at), amount: 0, items: [] };
      orders.push(o);
    }
    const kept = l.qty - l.returned_qty;
    o.amount += kept * toNumber(l.price);
    o.items.push({ id: l.id, name: l.name, image: l.image, qty: l.qty, returnedQty: l.returned_qty, price: toNumber(l.price) });
  }
  // Захиалгуудыг нэгтгэсэн: бараа (хувилбар) бүр хэдийг зарсан — буцаасныг хассан, цуцлагдсан ороогүй
  const byItem = new Map();
  for (const l of lines) {
    const kept = l.qty - l.returned_qty;
    const key = `${l.variant_id ?? ""}|${l.name}`;
    const row = byItem.get(key) ?? {
      productId: l.product_id,
      variantId: l.variant_id,
      name: l.name,
      image: l.image,
      orders: new Set(),
      qty: 0,
      deliveredQty: 0,
      returnedQty: 0,
      amount: 0,
      deliveredAmount: 0,
    };
    row.orders.add(l.order_id);
    row.qty += kept;
    row.returnedQty += l.returned_qty;
    row.amount += kept * toNumber(l.price);
    if (l.status === "delivered") {
      row.deliveredQty += kept;
      row.deliveredAmount += kept * toNumber(l.price);
    }
    byItem.set(key, row);
  }
  const items = [...byItem.values()]
    .map((r) => ({ ...r, orders: r.orders.size }))
    .filter((r) => r.qty > 0 || r.returnedQty > 0)
    .sort((a, b) => b.qty - a.qty || b.amount - a.amount || a.name.localeCompare(b.name));

  const settlements = await storeSettlements.findAll({ where: { shop_id: req.shopId, store_id: store.id }, order: [["id", "desc"]], raw: true });
  return ok(res, {
    ...summaryOf(store, sales.get(store.id), allTime.get(store.id), settled.get(store.id)),
    // Бүх хугацааны нийт тооцоо: delivered − settled = balance
    allTime: { delivered: toNumber(allTime.get(store.id)?.delivered), pending: toNumber(allTime.get(store.id)?.pending) },
    items,
    orders,
    settlements: settlements.map((s) => ({ id: s.id, amount: toNumber(s.amount), note: s.note, createdAt: toIso(s.created_at) })),
  });
});

// POST /storeReport/:storeId/settle { amount, note? } — худалдагчид мөнгө шилжүүлснээ тэмдэглэнэ
module.exports.settle = handle("storeSettle", async (req, res) => {
  const { amount, note, by, at } = req.body;
  const store = await stores.findOne({ where: { id: req.params.storeId, shop_id: req.shopId }, attributes: ["id"], raw: true });
  if (!store) return fail(res, "Дэлгүүр олдсонгүй");
  const value = Math.round(toNumber(amount) * 100) / 100;
  if (!(value > 0)) return fail(res, "Шилжүүлсэн дүнгээ оруулна уу");
  const t = await sequelize.transaction();
  try {
    // Зэрэг хоёр удаа дарвал давхар бичигдэхгүй
    await stores.findOne({ where: { id: store.id }, lock: t.LOCK.UPDATE, transaction: t });
    const allTime = (await salesByStore(req.shopId, { storeId: store.id })).get(store.id);
    const paid = toNumber(await storeSettlements.sum("amount", { where: { shop_id: req.shopId, store_id: store.id }, transaction: t }));
    const balance = toNumber(allTime?.delivered) - paid;
    if (value > balance + 0.001) throw `Олгох үлдэгдлээс (${Math.round(balance).toLocaleString("en-US")}₮) их байна`;
    const row = await storeSettlements.create(
      { shop_id: req.shopId, store_id: store.id, amount: value, note: String(note ?? "").trim().slice(0, 500) || null, created_by: by, created_at: at },
      { transaction: t },
    );
    await saveLog({ shop_id: req.shopId, object_name: "storeSettlements", object_id: row.id, log_action: "created", modify_data: JSON.stringify({ storeId: store.id, amount: value }), created_by: by, created_at: at }, t);
    await t.commit();
    return ok(res, { id: row.id });
  } catch (error) {
    await t.rollback();
    throw error;
  }
});
