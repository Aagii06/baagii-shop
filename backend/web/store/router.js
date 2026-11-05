const router = require("express").Router();
const { stores, products, sequelize } = require("../../models");
const { ok, handle } = require("../../helper/helper");

// Дэлгүүрийн бүх идэвхтэй борлуулагч дэлгүүр (бараагүй нь ч), нийтэлсэн барааны тоотой.
// Бараа ихтэй нь эхэндээ. Буцаах: [{ id, name, logo, productCount }]
router.get(
  "/",
  handle("storeList", async (req, res) => {
    const rows = await stores.findAll({
      where: { shop_id: req.shopId, status: "active" },
      attributes: ["id", "name", "logo"],
      raw: true,
    });
    const counts = await products.findAll({
      where: { shop_id: req.shopId, status: "active", is_active: true },
      attributes: ["store_id", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
      group: ["store_id"],
      raw: true,
    });
    const countOf = new Map(counts.map((c) => [c.store_id, Number(c.count)]));
    const list = rows
      .map((s) => ({ id: s.id, name: s.name, logo: s.logo || null, productCount: countOf.get(s.id) ?? 0 }))
      .sort((a, b) => b.productCount - a.productCount || String(a.name).localeCompare(String(b.name)));
    return ok(res, list);
  }),
);

module.exports = router;
