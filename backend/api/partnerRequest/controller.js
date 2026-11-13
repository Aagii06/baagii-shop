const bcrypt = require("bcryptjs");
const { partnerRequests, products, stores, users, sequelize, op } = require("../../models");
const { roles, partnerStatuses } = require("../../config/constants");
const { saveLog } = require("../../utils/logHelper");
const { ok, handle, toIso } = require("../../helper/helper");

// "Хамтран ажиллах" хүсэлт: вэбийн /seller хуудаснаас (POST /web/auth/register) утсаа OTP-оор
// баталгаажуулж, дэлгүүрийн мэдээллээ үлдээнэ. Батлахад тэр мэдээллээр дэлгүүр (stores),
// түүний SHOPPER хэрэглэгч (users) үүснэ.
const toRecord = (row) => ({
  id: row.id,
  phone: row.phone,
  storeName: row.store_name,
  name: row.name,
  email: row.email,
  address: row.address,
  status: row.status,
  storeId: row.store_id ?? null,
  createdAt: toIso(row.created_at),
});

// Хүлээгдэж буй нь эхэндээ, дараа нь шинэ нь эхэндээ.
// ?status= - зөвхөн тухайн төлөв, ?skip=&take= - хуудаслана (take-гүй бол бүгд).
// stats - төлөв бүрийн тоо (шүүлтээс үл хамааран)
module.exports.list = handle("partnerList", async (req, res) => {
  const where = { shop_id: req.shopId };
  if (partnerStatuses[req.query.status]) where.status = req.query.status;
  const take = Number(req.query.take) || undefined;
  const skip = take ? Math.max(Number(req.query.skip) || 0, 0) : undefined;
  const { rows, count } = await partnerRequests.findAndCountAll({ where, order: [[sequelize.literal(`\`status\` = '${partnerStatuses.pending}'`), "desc"], ["id", "desc"]], limit: take, offset: skip, raw: true });
  const grouped = await partnerRequests.findAll({
    where: { shop_id: req.shopId },
    attributes: ["status", [sequelize.fn("COUNT", sequelize.col("id")), "n"]],
    group: ["status"],
    raw: true,
  });
  const stats = Object.fromEntries(Object.values(partnerStatuses).map((s) => [s, 0]));
  for (const g of grouped) if (g.status in stats) stats[g.status] = Number(g.n);
  return ok(res, { rows: rows.map(toRecord), count, stats, summary: [] });
});

// { password, storeName? } — шинэ SHOPPER хэрэглэгчийн нэвтрэх нууц үг (6+ тэмдэгт), дэлгүүрийн нэр
// (хүсэлтээр ирснийг admin засаж болно; илгээгээгүй бол хүсэлтийнх)
module.exports.approve = handle("partnerApprove", async (req, res) => {
  const { by, at, password } = req.body;
  const t = await sequelize.transaction();
  try {
    const row = await partnerRequests.findOne({ where: { id: req.params.id, shop_id: req.shopId }, transaction: t });
    if (!row) throw "Хүсэлт олдсонгүй";
    if (row.status !== partnerStatuses.pending) throw "Хүсэлтийг аль хэдийн шийдвэрлэсэн байна";
    if (String(password ?? "").length < 6) throw "Нууц үг 6-аас дээш тэмдэгттэй байна";
    // Батлахад дэлгүүр (stores) үүсгэнэ — нэргүй дэлгүүр үүсгэхгүй
    const storeName = String(req.body.storeName ?? row.store_name ?? "").trim();
    if (!storeName) throw "Дэлгүүрийн нэр оруулна уу";
    if (await users.count({ where: { shop_id: req.shopId, phone: row.phone, status: "active" }, transaction: t }))
      throw "Энэ утасны дугаар хэрэглэгчид бүртгэлтэй байна";

    const audit = { status: "active", created_by: by, created_at: at };
    const store = await stores.create(
      { shop_id: req.shopId, name: storeName, phone: row.phone, email: row.email, address: row.address, ...audit },
      { transaction: t },
    );
    const user = await users.create(
      {
        shop_id: req.shopId,
        store_id: store.id,
        username: row.phone,
        phone: row.phone,
        name: row.name || row.phone,
        email: row.email,
        password: await bcrypt.hash(String(password), 10),
        role: roles.shopper,
        // Хүсэлт илгээхдээ утсаа SMS кодоор баталгаажуулсан
        phone_verified_at: at,
        ...audit,
      },
      { transaction: t },
    );
    await row.update(
      { status: partnerStatuses.approved, store_name: storeName, store_id: store.id, user_id: user.id, decided_by: by, decided_at: at, updated_at: at },
      { transaction: t },
    );
    await saveLog({ shop_id: req.shopId, object_name: "partnerRequests", object_id: row.id, log_action: partnerStatuses.approved, created_by: by, created_at: at }, t);
    await t.commit();
    return ok(res, toRecord(row));
  } catch (error) {
    await t.rollback();
    throw error;
  }
});

// Шийдвэрээ буцааж хүсэлтийг дахин хүлээгдэж буй болгоно. Баталсныг буцаахад батлахад үүссэн
// SHOPPER хэрэглэгч, дэлгүүрийг устгана (status: deleted) — дэлгүүрт бараа бүртгэгдсэн бол буцаахгүй.
// Тэр дугаараас өөр хүлээгдэж буй/баталсан хүсэлт байвал (татгалзсаны дараа дахин илгээсэн) буцаахгүй.
module.exports.revert = handle("partnerRevert", async (req, res) => {
  const { by, at } = req.body;
  const t = await sequelize.transaction();
  try {
    const row = await partnerRequests.findOne({ where: { id: req.params.id, shop_id: req.shopId }, transaction: t });
    if (!row) throw "Хүсэлт олдсонгүй";
    if (row.status === partnerStatuses.pending) throw "Хүсэлт хүлээгдэж буй байна";
    const other = await partnerRequests.count({
      where: { shop_id: req.shopId, phone: row.phone, id: { [op.ne]: row.id }, status: [partnerStatuses.pending, partnerStatuses.approved] },
      transaction: t,
    });
    if (other) throw "Энэ дугаараас өөр хүсэлт ирсэн байна";
    if (row.store_id && (await products.count({ where: { shop_id: req.shopId, store_id: row.store_id, status: "active" }, transaction: t })))
      throw "Дэлгүүрт бараа бүртгэлтэй тул буцаах боломжгүй. Эхлээд барааг устгана уу";

    const removed = { status: "deleted", deleted_by: by, deleted_at: at };
    if (row.user_id) await users.update(removed, { where: { id: row.user_id, shop_id: req.shopId }, transaction: t });
    if (row.store_id) await stores.update(removed, { where: { id: row.store_id, shop_id: req.shopId }, transaction: t });
    await row.update(
      { status: partnerStatuses.pending, store_id: null, user_id: null, decided_by: null, decided_at: null, updated_at: at },
      { transaction: t },
    );
    await saveLog({ shop_id: req.shopId, object_name: "partnerRequests", object_id: row.id, log_action: "reverted", created_by: by, created_at: at }, t);
    await t.commit();
    return ok(res, toRecord(row));
  } catch (error) {
    await t.rollback();
    throw error;
  }
});

module.exports.reject = handle("partnerReject", async (req, res) => {
  const { by, at } = req.body;
  const row = await partnerRequests.findOne({ where: { id: req.params.id, shop_id: req.shopId } });
  if (!row) throw "Хүсэлт олдсонгүй";
  if (row.status !== partnerStatuses.pending) throw "Хүсэлтийг аль хэдийн шийдвэрлэсэн байна";
  await row.update({ status: partnerStatuses.rejected, decided_by: by, decided_at: at, updated_at: at });
  await saveLog({ shop_id: req.shopId, object_name: "partnerRequests", object_id: row.id, log_action: partnerStatuses.rejected, created_by: by, created_at: at });
  return ok(res, toRecord(row));
});
