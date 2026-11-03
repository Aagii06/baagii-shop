const bcrypt = require("bcryptjs");
const { partnerRequests, stores, users, sequelize } = require("../../models");
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

module.exports.list = handle("partnerList", async (req, res) => {
  const rows = await partnerRequests.findAll({ where: { shop_id: req.shopId }, order: [["id", "desc"]], raw: true });
  return ok(res, { rows: rows.map(toRecord), count: rows.length, summary: [] });
});

// { password } — шинэ SHOPPER хэрэглэгчийн нэвтрэх нууц үг (6+ тэмдэгт)
module.exports.approve = handle("partnerApprove", async (req, res) => {
  const { by, at, password } = req.body;
  const t = await sequelize.transaction();
  try {
    const row = await partnerRequests.findOne({ where: { id: req.params.id, shop_id: req.shopId }, transaction: t });
    if (!row) throw "Хүсэлт олдсонгүй";
    if (row.status !== partnerStatuses.pending) throw "Хүсэлтийг аль хэдийн шийдвэрлэсэн байна";
    if (String(password ?? "").length < 6) throw "Нууц үг 6-аас дээш тэмдэгттэй байна";
    if (await users.count({ where: { shop_id: req.shopId, phone: row.phone, status: "active" }, transaction: t }))
      throw "Энэ утасны дугаар хэрэглэгчид бүртгэлтэй байна";

    const audit = { status: "active", created_by: by, created_at: at };
    const store = await stores.create(
      { shop_id: req.shopId, name: row.store_name || row.phone, phone: row.phone, email: row.email, address: row.address, ...audit },
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
        ...audit,
      },
      { transaction: t },
    );
    await row.update(
      { status: partnerStatuses.approved, store_id: store.id, user_id: user.id, decided_by: by, decided_at: at, updated_at: at },
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

module.exports.reject = handle("partnerReject", async (req, res) => {
  const { by, at } = req.body;
  const row = await partnerRequests.findOne({ where: { id: req.params.id, shop_id: req.shopId } });
  if (!row) throw "Хүсэлт олдсонгүй";
  if (row.status !== partnerStatuses.pending) throw "Хүсэлтийг аль хэдийн шийдвэрлэсэн байна";
  await row.update({ status: partnerStatuses.rejected, decided_by: by, decided_at: at, updated_at: at });
  await saveLog({ shop_id: req.shopId, object_name: "partnerRequests", object_id: row.id, log_action: partnerStatuses.rejected, created_by: by, created_at: at });
  return ok(res, toRecord(row));
});
