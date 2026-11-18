const { notifications, deviceTokens } = require("../../models");
const { ok, fail, handle, now, toIso } = require("../../helper/helper");

const toRecord = (row) => ({
  id: row.id,
  type: row.type,
  title: row.title,
  body: row.body ?? null,
  link: row.link ?? null,
  read: row.read_at != null,
  createdAt: toIso(row.created_at),
});

// Админ (/api/notification, ownerOf = нэвтэрсэн хэрэглэгч) ба худалдан авагч (/web/notification)
// хоёул ижил controller — зөвхөн хэний мэдэгдэл вэ гэдэг нь өөр.
module.exports.build = ({ ownerType, ownerOf }) => {
  const key = ownerType === "user" ? "user_id" : "customer_id";
  const mine = (req) => ({ shop_id: req.shopId, [key]: ownerOf(req) });
  const c = {};

  // ?skip=&take= → { rows (шинэ нь эхэндээ), count, unread }
  c.list = handle("notificationList", async (req, res) => {
    const take = Math.min(Math.max(Number(req.query.take) || 30, 1), 100);
    const skip = Math.max(Number(req.query.skip) || 0, 0);
    const [rows, count, unread] = await Promise.all([
      notifications.findAll({ where: mine(req), order: [["id", "desc"]], limit: take, offset: skip, raw: true }),
      notifications.count({ where: mine(req) }),
      notifications.count({ where: { ...mine(req), read_at: null } }),
    ]);
    return ok(res, { rows: rows.map(toRecord), count, unread, summary: [] });
  });

  // Зөвхөн уншаагүйн тоо (badge 30 секунд тутам асууна)
  c.unread = handle("notificationUnread", async (req, res) => {
    const unread = await notifications.count({ where: { ...mine(req), read_at: null } });
    return ok(res, { unread });
  });

  c.markRead = handle("notificationRead", async (req, res) => {
    await notifications.update({ read_at: now() }, { where: { ...mine(req), id: req.params.id, read_at: null } });
    return ok(res);
  });

  c.markAllRead = handle("notificationReadAll", async (req, res) => {
    await notifications.update({ read_at: now() }, { where: { ...mine(req), read_at: null } });
    return ok(res);
  });

  // Апп-ын push токен: { token, platform } — тухайн утсыг энэ хэрэглэгчид холбоно
  // (өмнө нь өөр хүнд бүртгэлтэй байсан бол шилжүүлнэ)
  c.registerDevice = handle("deviceRegister", async (req, res) => {
    const token = String(req.body?.token ?? "").trim();
    if (!token || token.length > 255) return fail(res, "Токен буруу байна");
    const platform = ["android", "ios"].includes(req.body?.platform) ? req.body.platform : null;
    const at = now();
    const values = { shop_id: req.shopId, owner_id: ownerOf(req), platform, updated_at: at };
    const row = await deviceTokens.findOne({ where: { token, owner_type: ownerType } });
    if (row) await row.update(values);
    else await deviceTokens.create({ ...values, token, owner_type: ownerType, created_at: at });
    return ok(res);
  });

  // Гарахад: { token } — энэ утас руу дахин push илгээхгүй
  c.removeDevice = handle("deviceRemove", async (req, res) => {
    const token = String(req.body?.token ?? "").trim();
    if (token) await deviceTokens.destroy({ where: { token, owner_type: ownerType, owner_id: ownerOf(req) } });
    return ok(res);
  });

  return c;
};
