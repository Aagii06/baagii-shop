const bcrypt = require("bcryptjs");
const { partnerRequests, users, stores, sequelize } = require("../../models");
const { findStore } = require("../../helper/storeHelper");
const { roles, partnerStatuses } = require("../../config/constants");
const { saveLog } = require("../../utils/logHelper");
const { ok, fail, handle, toIso, phoneDigits, isPhone } = require("../../helper/helper");

// "Хамтран ажиллах" хүсэлт: вэбийн /seller хуудаснаас (POST /web/auth/register) ирнэ.
// Батлахад тухайн дугаараар SHOPPER эрхтэй хэрэглэгч үүсч, сонгосон дэлгүүрт (stores) оноогдоно.
// store - батлагдсан борлуулагчийн дэлгүүр
const toRecord = (row, store = null) => ({
  id: row.id,
  phone: row.phone,
  status: row.status,
  store: store ? { id: store.id, name: store.name } : null,
  createdAt: toIso(row.created_at),
});

module.exports.list = handle("partnerList", async (req, res) => {
  const rows = await partnerRequests.findAll({ where: { shop_id: req.shopId }, order: [["id", "desc"]], raw: true });
  const shoppers = await users.findAll({
    where: { id: rows.map((r) => r.user_id).filter(Boolean), shop_id: req.shopId },
    include: [{ model: stores, as: "store", attributes: ["id", "name"], required: false, where: { status: "active" } }],
  });
  const storeOf = new Map(shoppers.map((u) => [u.id, u.store]));
  return ok(res, { rows: rows.map((r) => toRecord(r, storeOf.get(r.user_id))), count: rows.length, summary: [] });
});

// { storeId, password } — борлуулагчийн дэлгүүр (заавал), нэвтрэх нууц үг (6+ тэмдэгт)
const shopperInput = async (req, t) => {
  const { storeId, password } = req.body;
  const store = await findStore(req.shopId, storeId, t);
  if (!store) throw "Дэлгүүр сонгоно уу";
  if (String(password ?? "").length < 6) throw "Нууц үг 6-аас дээш тэмдэгттэй байна";
  return { store, password: await bcrypt.hash(String(password), 10) };
};

// Дугаарт SHOPPER хэрэглэгч байхгүй бол үүсгэнэ, байвал дэлгүүр, нууц үгийг нь шинэчилнэ.
// Тухайн дугаартай ADMIN-ийг өөрчлөхгүй.
const ensureShopper = async (shopId, phone, { store, password }, by, at, t) => {
  const existing = await users.findOne({ where: { shop_id: shopId, phone, status: "active" }, transaction: t });
  if (existing?.role === roles.admin) throw "Энэ дугаар админ хэрэглэгчийнх байна";
  if (existing) return existing.update({ store_id: store.id, password, updated_by: by, updated_at: at }, { transaction: t });
  return users.create(
    { shop_id: shopId, store_id: store.id, username: phone, phone, name: phone, password, role: roles.shopper, status: "active", created_by: by, created_at: at },
    { transaction: t },
  );
};

const decide = (status) => async (req, res) => {
  const { by, at } = req.body;
  const t = await sequelize.transaction();
  try {
    const row = await partnerRequests.findOne({ where: { id: req.params.id, shop_id: req.shopId }, transaction: t });
    if (!row) throw "Хүсэлт олдсонгүй";
    if (row.status !== partnerStatuses.pending) throw "Хүсэлтийг аль хэдийн шийдвэрлэсэн байна";
    const input = status === partnerStatuses.approved ? await shopperInput(req, t) : null;
    const user = input ? await ensureShopper(req.shopId, row.phone, input, by, at, t) : null;
    await row.update({ status, user_id: user?.id ?? null, decided_by: by, decided_at: at, updated_at: at }, { transaction: t });
    await saveLog({ shop_id: req.shopId, object_name: "partnerRequests", object_id: row.id, log_action: status, created_by: by, created_at: at }, t);
    await t.commit();
    return ok(res, toRecord(row, input?.store));
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
    const input = await shopperInput(req, t);
    const user = await ensureShopper(req.shopId, digits, input, by, at, t);
    const row = await partnerRequests.create(
      { shop_id: req.shopId, phone: digits, status: partnerStatuses.approved, user_id: user.id, decided_by: by, decided_at: at, created_by: by, created_at: at },
      { transaction: t },
    );
    await t.commit();
    return ok(res, toRecord(row, input.store));
  } catch (error) {
    await t.rollback();
    throw error;
  }
});
