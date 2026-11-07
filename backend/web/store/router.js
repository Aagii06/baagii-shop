const router = require("express").Router();
const { stores, products, sequelize } = require("../../models");
const { ok, handle } = require("../../helper/helper");
const { storeTiers } = require("../../config/constants");

// gold → silver → bronze → normal
const tierRank = (tier) => {
  const i = storeTiers.indexOf(tier);
  return i === -1 ? storeTiers.length : i;
};

// Дэлгүүрийн бүх идэвхтэй борлуулагч дэлгүүр (бараагүй нь ч), нийтэлсэн барааны тоотой.
// Өндөр түвшнийх (gold → silver → bronze → normal), дараа нь бараа ихтэй нь эхэндээ.
// Буцаах: [{ id, name, logo, tier, productCount }]
router.get(
  "/",
  handle("storeList", async (req, res) => {
    const rows = await stores.findAll({
      where: { shop_id: req.shopId, status: "active" },
      attributes: ["id", "name", "logo", "tier"],
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
      .map((s) => ({ id: s.id, name: s.name, logo: s.logo || null, tier: s.tier || "normal", productCount: countOf.get(s.id) ?? 0 }))
      .sort(
        (a, b) =>
          tierRank(a.tier) - tierRank(b.tier) ||
          b.productCount - a.productCount ||
          String(a.name).localeCompare(String(b.name)),
      );
    return ok(res, list);
  }),
);

module.exports = router;
