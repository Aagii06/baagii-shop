const router = require("express").Router();
const { testimonials } = require("../../models");
const { toTestimonial, ORDER } = require("../../helper/testimonialHelper");
const { ok, handle } = require("../../helper/helper");

// Нүүр хуудасны "Эцэг эхчүүдийн сэтгэгдэл" — идэвхтэй нь, дарааллаар
router.get(
  "/",
  handle("testimonialList", async (req, res) => {
    const rows = await testimonials.findAll({ where: { shop_id: req.shopId, status: "active", is_active: true }, order: ORDER });
    return ok(res, { rows: rows.map(toTestimonial), count: rows.length, summary: [] });
  }),
);

module.exports = router;
