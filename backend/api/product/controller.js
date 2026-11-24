const { products, productVariants, orderItems, stores, sequelize, op } = require("../../models");
const { productInclude, variantOrder, toAdminProduct, saveProduct, findProduct } = require("../../helper/productHelper");
const { saveLog } = require("../../utils/logHelper");
const { findStore, ownStoreId } = require("../../helper/storeHelper");
const { ok, fail, handle } = require("../../helper/helper");

// SHOPPER зөвхөн өөрийн дэлгүүрийн бараатай ажиллана (дэлгүүргүй бол юу ч үгүй)
const storeScope = (own) => (own === undefined ? {} : { store_id: own ?? 0 });

// Барааны дэлгүүр: SHOPPER-т өөрийнх нь, ADMIN-д сонгосон нь (body.storeId, хоосон бол null).
// storeId илгээгээгүй бол undefined — засахад хуучнаараа үлдэнэ.
const storeFor = async (req, own) => {
  if (own === null) throw "Танд дэлгүүр оноогоогүй байна. Админд хандана уу";
  if (own !== undefined) return own;
  if (!("storeId" in req.body)) return undefined;
  if (!req.body.storeId) return null;
  if (!(await findStore(req.shopId, req.body.storeId))) throw "Дэлгүүр олдсонгүй";
  return Number(req.body.storeId);
};

// ?take=&skip=&filter=["name","contains","цамц"]&sort=[{"selector":"id"}]; анхдагч нь шинэ нь эхэндээ
module.exports.list = handle("productList", async (req, res) => {
  const { limit, offset, where, order } = req;
  const scope = storeScope(await ownStoreId(req));
  const { rows, count } = await products.findAndCountAll({
    where: { [op.and]: [...where, { shop_id: req.shopId, status: "active", ...scope }] },
    include: productInclude,
    distinct: true,
    limit,
    offset,
    order: [...(order?.length ? order : [["id", "desc"]]), ...variantOrder],
  });
  return ok(res, { rows: rows.map(toAdminProduct), count, summary: [] });
});

// Захиалгад орсон бараа устгагдахгүй — зөвхөн нийтлэлээс хасаж (is_active) web-ээс нууна
const hasOrders = async (productId) => (await orderItems.count({ where: { product_id: productId } })) > 0;

module.exports.show = handle("productShow", async (req, res) => {
  const scope = storeScope(await ownStoreId(req));
  const product = await findProduct({ id: req.params.id, shop_id: req.shopId, ...scope });
  return ok(res, product ? { ...toAdminProduct(product), hasOrders: await hasOrders(product.id) } : null);
});

module.exports.create = handle("productCreate", async (req, res) => {
  const { by, at, ...body } = req.body;
  const storeId = await storeFor(req, await ownStoreId(req));
  // Дэлгүүр бүртгэлтэй бол бараа заавал аль нэг дэлгүүрт (үүсгэсний дараа солигдохгүй)
  if (storeId == null && (await stores.count({ where: { shop_id: req.shopId, status: "active" } })) > 0)
    return fail(res, "Дэлгүүр сонгоно уу");
  const id = await saveProduct({ shopId: req.shopId, body, by, storeId });
  return ok(res, toAdminProduct(await findProduct({ id, shop_id: req.shopId })));
});

module.exports.update = handle("productUpdate", async (req, res) => {
  const { by, at, ...body } = req.body;
  const own = await ownStoreId(req);
  const current = await products.findOne({
    where: { id: req.params.id, shop_id: req.shopId, status: "active", ...storeScope(own) },
    attributes: ["id", "store_id"],
    raw: true,
  });
  if (!current) return fail(res, "Бараа олдсонгүй");
  // Бараа дэлгүүр хооронд шилжихгүй: захиалга, тооцоо, мэдэгдэл дэлгүүрээрээ явдаг
  const storeId = await storeFor(req, own);
  if (storeId !== undefined && storeId !== (current.store_id ?? null))
    return fail(res, "Барааны дэлгүүрийг солих боломжгүй. Шинэ дэлгүүрт шинээр бараа үүсгэнэ үү");
  const id = await saveProduct({ shopId: req.shopId, id: req.params.id, body, by });
  return ok(res, toAdminProduct(await findProduct({ id, shop_id: req.shopId })));
});

// Зөөлөн устгал: хуучин захиалга дээрх нэр, үнэ хэвээр үлдэнэ
module.exports.destroy = handle("productDestroy", async (req, res) => {
  const { by, at } = req.body;
  const scope = storeScope(await ownStoreId(req));
  const product = await products.findOne({ where: { id: req.params.id, shop_id: req.shopId, status: "active", ...scope } });
  if (!product) return fail(res, "Бараа олдсонгүй");
  if (await hasOrders(product.id))
    return fail(res, "Энэ бараа захиалгад орсон тул устгах боломжгүй. Вэб дээр харагдахгүй болгох бол \"Нийтлэх\"-ийг унтраана уу");
  const t = await sequelize.transaction();
  try {
    const deleted = { status: "deleted", deleted_by: by, deleted_at: at };
    await product.update(deleted, { transaction: t });
    await productVariants.update(deleted, { where: { product_id: product.id, status: "active" }, transaction: t });
    await saveLog({ shop_id: req.shopId, object_name: "products", object_id: product.id, log_action: "deleted", created_by: by, created_at: at }, t);
    await t.commit();
    return ok(res, null);
  } catch (error) {
    await t.rollback();
    throw error;
  }
});
