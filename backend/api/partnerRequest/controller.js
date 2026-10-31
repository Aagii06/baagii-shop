const { partnerRequests, users, sequelize } = require("../../models");
const { roles, partnerStatuses } = require("../../config/constants");
const { saveLog } = require("../../utils/logHelper");
const { ok, fail, handle, toIso, phoneDigits, isPhone } = require("../../helper/helper");

// "Хамтран ажиллах" хүсэлт: вэбийн /seller хуудаснаас (POST /web/auth/register) ирнэ.
// Батлахад тухайн дугаараар SHOPPER эрхтэй хэрэглэгч үүснэ.
const toRecord = (row) => ({ id: row.id, phone: row.phone, status: row.status, createdAt: toIso(row.created_at) });

module.exports.list = handle("partnerList", async (req, res) => {
  const rows = await partnerRequests.findAll({ where: { shop_id: req.shopId }, order: [["id", "desc"]], raw: true });
  return ok(res, { rows: rows.map(toRecord), count: rows.length, summary: [] });
});

// Дугаарт SHOPPER хэрэглэгч байхгүй бол үүсгэнэ (нууц үггүй — нэвтрэхийн тулд админ тохируулна)
const ensureShopper = async (shopId, phone, by, at, t) => {
  const existing = await users.findOne({ where: { shop_id: shopId, username: phone, status: "active" }, transaction: t });
  if (existing) return existing;
  return users.create({ shop_id: shopId, username: phone, phone, name: phone, role: roles.shopper, status: "active", created_by: by, created_at: at }, { transaction: t });
};

const decide = (status) => async (req, res) => {
  const { by, at } = req.body;
  const t = await sequelize.transaction();
  try {
    const row = await partnerRequests.findOne({ where: { id: req.params.id, shop_id: req.shopId }, transaction: t });
    if (!row) throw "Хүсэлт олдсонгүй";
    if (row.status !== partnerStatuses.pending) throw "Хүсэлтийг аль хэдийн шийдвэрлэсэн байна";
    const user = status === partnerStatuses.approved ? await ensureShopper(req.shopId, row.phone, by, at, t) : null;
    await row.update({ status, user_id: user?.id ?? null, decided_by: by, decided_at: at, updated_at: at }, { transaction: t });
    await saveLog({ shop_id: req.shopId, object_name: "partnerRequests", object_id: row.id, log_action: status, created_by: by, created_at: at }, t);
    await t.commit();
    return ok(res, toRecord(row));
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

module.exports.approve = handle("partnerApprove", decide(partnerStatuses.approved));
module.exports.reject = handle("partnerReject", decide(partnerStatuses.rejected));

// Админ дугаараар шууд нэмнэ — батлагдсан хүсэлт болж харагдана
module.exports.create = handle("partnerCreate", async (req, res) => {
  const { phone, by, at } = req.body;
  if (!isPhone(phone)) return fail(res, "Утасны дугаар 8 оронтой байна");
  const digits = phoneDigits(phone);
  if (await partnerRequests.findOne({ where: { shop_id: req.shopId, phone: digits, status: partnerStatuses.approved } }))
    return fail(res, "Энэ дугаар аль хэдийн бүртгэлтэй байна");
  const t = await sequelize.transaction();
  try {
    const user = await ensureShopper(req.shopId, digits, by, at, t);
    const row = await partnerRequests.create(
      { shop_id: req.shopId, phone: digits, status: partnerStatuses.approved, user_id: user.id, decided_by: by, decided_at: at, created_by: by, created_at: at },
      { transaction: t },
    );
    await t.commit();
    return ok(res, toRecord(row));
  } catch (error) {
    await t.rollback();
    throw error;
  }
});
