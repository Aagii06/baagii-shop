const router = require("express").Router();
const { blogs } = require("../../models");
const { toBlogPost } = require("../../helper/blogHelper");
const { ok, fail, handle } = require("../../helper/helper");

// Нийтэлсэн нийтлэлүүд, шинэ нь эхэндээ
const published = (req) => ({ shop_id: req.shopId, status: "active", is_active: true });

router.get(
  "/",
  handle("blogList", async (req, res) => {
    const rows = await blogs.findAll({ where: published(req), order: [["date", "desc"], ["id", "desc"]] });
    return ok(res, { rows: rows.map(toBlogPost), count: rows.length, summary: [] });
  }),
);

router.get(
  "/:slug",
  handle("blogShow", async (req, res) => {
    const row = await blogs.findOne({ where: { ...published(req), slug: req.params.slug } });
    if (!row) return fail(res, "Нийтлэл олдсонгүй");
    return ok(res, toBlogPost(row));
  }),
);

module.exports = router;
