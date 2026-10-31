const { products, productVariants, sequelize, op } = require("../../models");
const { productInclude, variantOrder, toAdminProduct, saveProduct, findProduct } = require("../../helper/productHelper");
const { saveLog } = require("../../utils/logHelper");
const { ok, fail, handle } = require("../../helper/helper");

// ?take=&skip=&filter=["name","contains","цамц"]&sort=[{"selector":"id"}]; анхдагч нь шинэ нь эхэндээ
module.exports.list = handle("productList", async (req, res) => {
  const { limit, offset, where, order } = req;
  const { rows, count } = await products.findAndCountAll({
    where: { [op.and]: [...where, { status: "active" }] },
    include: productInclude,
    distinct: true,
    limit,
    offset,
    order: [...(order?.length ? order : [["id", "desc"]]), ...variantOrder],
  });
  return ok(res, { rows: rows.map(toAdminProduct), count, summary: [] });
});

module.exports.show = handle("productShow", async (req, res) => {
  const product = await findProduct({ id: req.params.id });
  return ok(res, product ? toAdminProduct(product) : null);
});

module.exports.create = handle("productCreate", async (req, res) => {
  const { by, at, ...body } = req.body;
  const id = await saveProduct({ body, by });
  return ok(res, toAdminProduct(await findProduct({ id })));
});

module.exports.update = handle("productUpdate", async (req, res) => {
  const { by, at, ...body } = req.body;
  const id = await saveProduct({ id: req.params.id, body, by });
  return ok(res, toAdminProduct(await findProduct({ id })));
});

// Зөөлөн устгал: хуучин захиалга дээрх нэр, үнэ хэвээр үлдэнэ
module.exports.destroy = handle("productDestroy", async (req, res) => {
  const { by, at } = req.body;
  const product = await products.findOne({ where: { id: req.params.id, status: "active" } });
  if (!product) return fail(res, "Бараа олдсонгүй");
  const t = await sequelize.transaction();
  try {
    const deleted = { status: "deleted", deleted_by: by, deleted_at: at };
    await product.update(deleted, { transaction: t });
    await productVariants.update(deleted, { where: { product_id: product.id, status: "active" }, transaction: t });
    await saveLog({ object_name: "products", object_id: product.id, log_action: "deleted", created_by: by, created_at: at }, t);
    await t.commit();
    return ok(res, null);
  } catch (error) {
    await t.rollback();
    throw error;
  }
});
