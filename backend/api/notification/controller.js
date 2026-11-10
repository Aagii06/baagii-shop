const { notifications } = require("../../models");
const { ok, handle, now, toIso } = require("../../helper/helper");

// Админы толгойн 🔔: зөвхөн нэвтэрсэн хэрэглэгчийн өөрийн мэдэгдлүүд
const mine = (req) => ({ shop_id: req.shopId, user_id: req.loggedUser.id });

const toRecord = (row) => ({
  id: row.id,
  type: row.type,
  title: row.title,
  body: row.body ?? null,
  link: row.link ?? null,
  read: row.read_at != null,
  createdAt: toIso(row.created_at),
});

// ?skip=&take= → { rows (шинэ нь эхэндээ), count, unread }
module.exports.list = handle("notificationList", async (req, res) => {
  const take = Math.min(Math.max(Number(req.query.take) || 30, 1), 100);
  const skip = Math.max(Number(req.query.skip) || 0, 0);
  const [rows, count, unread] = await Promise.all([
    notifications.findAll({ where: mine(req), order: [["id", "desc"]], limit: take, offset: skip, raw: true }),
    notifications.count({ where: mine(req) }),
    notifications.count({ where: { ...mine(req), read_at: null } }),
  ]);
  return ok(res, { rows: rows.map(toRecord), count, unread, summary: [] });
});

// Зөвхөн уншаагүйн тоо (толгойн badge 30 секунд тутам асууна)
module.exports.unread = handle("notificationUnread", async (req, res) => {
  const unread = await notifications.count({ where: { ...mine(req), read_at: null } });
  return ok(res, { unread });
});

module.exports.markRead = handle("notificationRead", async (req, res) => {
  await notifications.update({ read_at: now() }, { where: { ...mine(req), id: req.params.id, read_at: null } });
  return ok(res);
});

module.exports.markAllRead = handle("notificationReadAll", async (req, res) => {
  await notifications.update({ read_at: now() }, { where: { ...mine(req), read_at: null } });
  return ok(res);
});
