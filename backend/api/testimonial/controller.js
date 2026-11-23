const { testimonials, op } = require("../../models");
const { toTestimonial, ORDER } = require("../../helper/testimonialHelper");
const { saveLog } = require("../../utils/logHelper");
const { ok, fail, handle, toNumber } = require("../../helper/helper");

module.exports.list = handle("testimonialList", async (req, res) => {
  const { limit, offset, where } = req;
  const { rows, count } = await testimonials.findAndCountAll({
    where: { [op.and]: [...where, { shop_id: req.shopId, status: "active" }] },
    limit,
    offset,
    order: ORDER,
  });
  return ok(res, { rows: rows.map(toTestimonial), count, summary: [] });
});

module.exports.show = handle("testimonialShow", async (req, res) => {
  const row = await testimonials.findOne({ where: { id: req.params.id, shop_id: req.shopId, status: "active" } });
  return ok(res, row ? toTestimonial(row) : null);
});

const fields = (body) => ({
  quote: body.quote.trim(),
  name: body.name.trim(),
  role: body.role?.trim() || null,
  rating: Math.min(5, Math.max(1, Math.round(toNumber(body.rating) || 5))),
  sort_order: Math.round(toNumber(body.sortOrder) || 0),
  is_active: body.isActive !== false,
});

module.exports.create = handle("testimonialCreate", async (req, res) => {
  const { by, at, ...body } = req.body;
  const row = await testimonials.create({ ...fields(body), shop_id: req.shopId, status: "active", created_by: by, created_at: at });
  await saveLog({ shop_id: req.shopId, object_name: "testimonials", object_id: row.id, log_action: "created", modify_data: JSON.stringify(body), created_by: by, created_at: at });
  return ok(res, toTestimonial(row));
});

module.exports.update = handle("testimonialUpdate", async (req, res) => {
  const { by, at, ...body } = req.body;
  const row = await testimonials.findOne({ where: { id: req.params.id, shop_id: req.shopId, status: "active" } });
  if (!row) return fail(res, "Сэтгэгдэл олдсонгүй");
  await row.update({ ...fields(body), updated_by: by, updated_at: at });
  await saveLog({ shop_id: req.shopId, object_name: "testimonials", object_id: row.id, log_action: "updated", modify_data: JSON.stringify(body), created_by: by, created_at: at });
  return ok(res, toTestimonial(row));
});

module.exports.destroy = handle("testimonialDestroy", async (req, res) => {
  const { by, at } = req.body;
  const row = await testimonials.findOne({ where: { id: req.params.id, shop_id: req.shopId, status: "active" } });
  if (!row) return fail(res, "Сэтгэгдэл олдсонгүй");
  await row.update({ status: "deleted", deleted_by: by, deleted_at: at });
  await saveLog({ shop_id: req.shopId, object_name: "testimonials", object_id: row.id, log_action: "deleted", created_by: by, created_at: at });
  return ok(res, null);
});
