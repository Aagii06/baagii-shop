const { partnerRequests, sequelize } = require("../../models");
const { partnerStatuses } = require("../../config/constants");
const { saveLog } = require("../../utils/logHelper");
const { ok, handle, toIso } = require("../../helper/helper");

// "Хамтран ажиллах" хүсэлт: вэбийн /seller хуудаснаас (POST /web/auth/register) ирнэ.
// Батлах / татгалзах нь зөвхөн шийдвэрийг тэмдэглэнэ — батлагдсаны дараа админ дэлгүүр (/store),
// хэрэглэгчийг (/user) өөрөө бүртгэнэ.
const toRecord = (row) => ({ id: row.id, phone: row.phone, status: row.status, createdAt: toIso(row.created_at) });

module.exports.list = handle("partnerList", async (req, res) => {
  const rows = await partnerRequests.findAll({ where: { shop_id: req.shopId }, order: [["id", "desc"]], raw: true });
  return ok(res, { rows: rows.map(toRecord), count: rows.length, summary: [] });
});

const decide = (status) => async (req, res) => {
  const { by, at } = req.body;
  const t = await sequelize.transaction();
  try {
    const row = await partnerRequests.findOne({ where: { id: req.params.id, shop_id: req.shopId }, transaction: t });
    if (!row) throw "Хүсэлт олдсонгүй";
    if (row.status !== partnerStatuses.pending) throw "Хүсэлтийг аль хэдийн шийдвэрлэсэн байна";
    await row.update({ status, decided_by: by, decided_at: at, updated_at: at }, { transaction: t });
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
