const router = require("express").Router();
const { products, categories, op } = require("../../models");
const { productInclude, variantOrder, toWebPost, findProduct } = require("../../helper/productHelper");
const { ok, fail, handle } = require("../../helper/helper");

// Нийтэлсэн (is_active) бараа. ?categoryId=&search=&page=&limit=
router.get(
  "/",
  handle("postList", async (req, res) => {
    const { categoryId, search } = req.query;
    const limit = Math.min(Number(req.query.limit) || 1000, 1000);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const where = { shop_id: req.shopId, status: "active", is_active: true };
    if (categoryId) where.category_id = Number(categoryId);
    if (search?.trim()) where.name = { [op.like]: `%${search.trim()}%` };
    const { rows, count } = await products.findAndCountAll({
      where,
      include: productInclude,
      distinct: true,
      limit,
      offset: (page - 1) * limit,
      order: [["id", "desc"], ...variantOrder],
    });
    return ok(res, { rows: rows.map((p) => toWebPost(p)), count, summary: [] });
  }),
);

router.get(
  "/:id",
  handle("postShow", async (req, res) => {
    const product = await findProduct({ id: req.params.id, shop_id: req.shopId, is_active: true });
    if (!product) return fail(res, "Бараа олдсонгүй");
    return ok(res, toWebPost(product, true));
  }),
);

module.exports = router;
