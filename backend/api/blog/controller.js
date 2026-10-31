const { blogs, sequelize, op } = require("../../models");
const { uniqueSlug, toBlogPost } = require("../../helper/blogHelper");
const { saveLog } = require("../../utils/logHelper");
const { ok, fail, handle, today, toNumber } = require("../../helper/helper");

// Шинэ нь эхэндээ (огноогоор)
module.exports.list = handle("blogList", async (req, res) => {
  const { limit, offset, where, order } = req;
  const { rows, count } = await blogs.findAndCountAll({
    where: { [op.and]: [...where, { shop_id: req.shopId, status: "active" }] },
    limit,
    offset,
    order: order?.length ? order : [["date", "desc"], ["id", "desc"]],
  });
  return ok(res, { rows: rows.map(toBlogPost), count, summary: [] });
});

module.exports.show = handle("blogShow", async (req, res) => {
  const row = await blogs.findOne({ where: { id: req.params.id, shop_id: req.shopId, status: "active" } });
  return ok(res, row ? toBlogPost(row) : null);
});

const fields = (body) => ({
  title: body.title.trim(),
  excerpt: body.excerpt || null,
  tag: body.tag || null,
  author: body.author || null,
  date: /^\d{4}-\d{2}-\d{2}/.test(body.date ?? "") ? body.date.slice(0, 10) : today(),
  read_minutes: body.readMinutes ? Math.max(1, Math.round(toNumber(body.readMinutes))) : null,
  image: body.image || null,
  body: body.body.trim(),
  is_active: body.isActive !== false && body.statusId !== "inactive",
});

module.exports.create = handle("blogCreate", async (req, res) => {
  const { by, at, ...body } = req.body;
  const t = await sequelize.transaction();
  try {
    const row = await blogs.create(
      { ...fields(body), shop_id: req.shopId, slug: await uniqueSlug(req.shopId, body.title, t), status: "active", created_by: by, created_at: at },
      { transaction: t },
    );
    await saveLog({ shop_id: req.shopId, object_name: "blogs", object_id: row.id, log_action: "created", modify_data: JSON.stringify(body), created_by: by, created_at: at }, t);
    await t.commit();
    return ok(res, toBlogPost(row));
  } catch (error) {
    await t.rollback();
    throw error;
  }
});

// slug өөрчлөгдөхгүй — хуваалцсан холбоос хэвээр ажиллана
module.exports.update = handle("blogUpdate", async (req, res) => {
  const { by, at, ...body } = req.body;
  const row = await blogs.findOne({ where: { id: req.params.id, shop_id: req.shopId, status: "active" } });
  if (!row) return fail(res, "Нийтлэл олдсонгүй");
  await row.update({ ...fields(body), updated_by: by, updated_at: at });
  await saveLog({ shop_id: req.shopId, object_name: "blogs", object_id: row.id, log_action: "updated", modify_data: JSON.stringify(body), created_by: by, created_at: at });
  return ok(res, toBlogPost(row));
});

module.exports.destroy = handle("blogDestroy", async (req, res) => {
  const { by, at } = req.body;
  const row = await blogs.findOne({ where: { id: req.params.id, shop_id: req.shopId, status: "active" } });
  if (!row) return fail(res, "Нийтлэл олдсонгүй");
  await row.update({ status: "deleted", deleted_by: by, deleted_at: at });
  await saveLog({ shop_id: req.shopId, object_name: "blogs", object_id: row.id, log_action: "deleted", created_by: by, created_at: at });
  return ok(res, null);
});
