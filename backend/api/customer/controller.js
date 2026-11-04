const { customers, orders, sequelize } = require("../../models");
const { ok, handle, toIso } = require("../../helper/helper");

// Вэбээр (утас + OTP) нэвтэрсэн худалдан авагчид. Нэрийг худалдан авагч өөрөө вэбээс засна
// (анх "Зочин"), admin зөвхөн харна. admin/src/lib/api/customers.ts-ийн Customer
module.exports.list = handle("customerList", async (req, res) => {
  const rows = await customers.findAll({
    where: { shop_id: req.shopId, status: "active" },
    order: [["id", "desc"]],
    raw: true,
  });
  const counts = await orders.findAll({
    where: { shop_id: req.shopId, customer_id: rows.map((r) => r.id) },
    attributes: ["customer_id", [sequelize.fn("COUNT", sequelize.col("id")), "cnt"], [sequelize.fn("MAX", sequelize.col("created_at")), "last"]],
    group: ["customer_id"],
    raw: true,
  });
  const statOf = new Map(counts.map((c) => [c.customer_id, c]));
  const data = rows.map((r) => ({
    id: r.id,
    phone: r.phone,
    name: r.name,
    orderCount: Number(statOf.get(r.id)?.cnt ?? 0),
    lastOrderAt: toIso(statOf.get(r.id)?.last),
    createdAt: toIso(r.created_at),
  }));
  return ok(res, { rows: data, count: data.length, summary: [] });
});
