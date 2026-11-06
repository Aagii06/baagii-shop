const { feedbacks } = require("../../models");
const { feedbackStatuses } = require("../../config/constants");
const { ok, handle, toIso } = require("../../helper/helper");

// Вэбийн "Бидэнд бичнэ үү" маягтаар ирсэн санал хүсэлт (POST /web/feedback)
const toRecord = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone ?? null,
  subject: row.subject ?? null,
  message: row.message,
  status: row.status,
  createdAt: toIso(row.created_at),
  readAt: toIso(row.read_at),
});

module.exports.list = handle("feedbackList", async (req, res) => {
  const rows = await feedbacks.findAll({ where: { shop_id: req.shopId }, order: [["id", "desc"]], raw: true });
  return ok(res, { rows: rows.map(toRecord), count: rows.length, summary: [] });
});

const findRow = async (req) => {
  const row = await feedbacks.findOne({ where: { id: req.params.id, shop_id: req.shopId } });
  if (!row) throw "Санал хүсэлт олдсонгүй";
  return row;
};

module.exports.markRead = handle("feedbackRead", async (req, res) => {
  const { by, at } = req.body;
  const row = await findRow(req);
  if (row.status !== feedbackStatuses.read)
    await row.update({ status: feedbackStatuses.read, read_by: by, read_at: at, updated_at: at });
  return ok(res, toRecord(row));
});

module.exports.markUnread = handle("feedbackUnread", async (req, res) => {
  const { at } = req.body;
  const row = await findRow(req);
  await row.update({ status: feedbackStatuses.new, read_by: null, read_at: null, updated_at: at });
  return ok(res, toRecord(row));
});

module.exports.remove = handle("feedbackDelete", async (req, res) => {
  const row = await findRow(req);
  await row.destroy();
  return ok(res);
});
