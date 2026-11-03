const { stores, products, users, sequelize } = require("../../models");
const { toStore, findStore, ownStoreId } = require("../../helper/storeHelper");
const { saveLog } = require("../../utils/logHelper");
const { ok, fail, handle, phoneDigits } = require("../../helper/helper");

// Борлуулагч дэлгүүрүүд, нэрээр. SHOPPER зөвхөн өөрийнхөө дэлгүүрийг харна.
module.exports.list = handle("storeList", async (req, res) => {
  const own = await ownStoreId(req);
  const where = { shop_id: req.shopId, status: "active" };
  if (own !== undefined) where.id = own ?? 0;
  const rows = await stores.findAll({ where, order: [["name", "asc"], ["id", "asc"]] });
  const counts = await products.findAll({
    where: { shop_id: req.shopId, status: "active", store_id: rows.map((r) => r.id) },
    attributes: ["store_id", [sequelize.fn("COUNT", sequelize.col("id")), "cnt"]],
    group: ["store_id"],
    raw: true,
  });
  const cntOf = new Map(counts.map((c) => [c.store_id, Number(c.cnt)]));
  return ok(res, { rows: rows.map((r) => toStore(r, cntOf.get(r.id) ?? 0)), count: rows.length, summary: [] });
});

module.exports.show = handle("storeShow", async (req, res) => {
  const own = await ownStoreId(req);
  if (own !== undefined && own !== Number(req.params.id)) return ok(res, null);
  const row = await findStore(req.shopId, req.params.id);
  return ok(res, row ? toStore(row) : null);
});

const fields = (body) => ({
  name: body.name.trim(),
  phone: phoneDigits(body.phone),
  email: body.email?.trim() || null,
  address: body.address?.trim() || null,
  logo: body.logo || null,
});

module.exports.create = handle("storeCreate", async (req, res) => {
  const { by, at, ...body } = req.body;
  const row = await stores.create({ ...fields(body), shop_id: req.shopId, status: "active", created_by: by, created_at: at });
  await saveLog({ shop_id: req.shopId, object_name: "stores", object_id: row.id, log_action: "created", modify_data: JSON.stringify(body), created_by: by, created_at: at });
  return ok(res, toStore(row));
});

module.exports.update = handle("storeUpdate", async (req, res) => {
  const { by, at, ...body } = req.body;
  const row = await findStore(req.shopId, req.params.id);
  if (!row) return fail(res, "Дэлгүүр олдсонгүй");
  await row.update({ ...fields(body), updated_by: by, updated_at: at });
  await saveLog({ shop_id: req.shopId, object_name: "stores", object_id: row.id, log_action: "updated", modify_data: JSON.stringify(body), created_by: by, created_at: at });
  return ok(res, toStore(row));
});

// Бараа эсвэл хэрэглэгч холбогдсон дэлгүүрийг устгахгүй — эхлээд тэднийг шилжүүлнэ
module.exports.destroy = handle("storeDestroy", async (req, res) => {
  const { by, at } = req.body;
  const row = await findStore(req.shopId, req.params.id);
  if (!row) return fail(res, "Дэлгүүр олдсонгүй");
  if (await products.count({ where: { shop_id: req.shopId, store_id: row.id, status: "active" } }))
    return fail(res, "Дэлгүүрт бараа бүртгэлтэй тул устгах боломжгүй");
  if (await users.count({ where: { shop_id: req.shopId, store_id: row.id, status: "active" } }))
    return fail(res, "Дэлгүүрт хэрэглэгч бүртгэлтэй тул устгах боломжгүй");
  await row.update({ status: "deleted", deleted_by: by, deleted_at: at });
  await saveLog({ shop_id: req.shopId, object_name: "stores", object_id: row.id, log_action: "deleted", created_by: by, created_at: at });
  return ok(res, null);
});
