const router = require("express").Router();
const { stores, products, sequelize } = require("../../models");
const { ok, fail, handle } = require("../../helper/helper");
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

// Нэг дэлгүүр (дэлгүүрийн хуудас — web /store?id=): холбоо барих мэдээлэлтэй.
// Буцаах: { id, name, logo, tier, productCount, phones, emails, addresses }
router.get(
  "/:id",
  handle("storeShow", async (req, res) => {
    const id = Number(req.params.id);
    const row = Number.isInteger(id)
      ? await stores.findOne({ where: { id, shop_id: req.shopId, status: "active" }, raw: true })
      : null;
    if (!row) return fail(res, "Дэлгүүр олдсонгүй");
    const productCount = await products.count({
      where: { shop_id: req.shopId, store_id: row.id, status: "active", is_active: true },
    });
    return ok(res, {
      id: row.id,
      name: row.name,
      logo: row.logo || null,
      tier: row.tier || "normal",
      productCount,
      phones: stores.listOf(row, "phones", "phone"),
      emails: stores.listOf(row, "emails", "email"),
      addresses: stores.listOf(row, "addresses", "address"),
    });
  }),
);

module.exports = router;
