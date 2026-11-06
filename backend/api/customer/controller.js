const bcrypt = require("bcryptjs");
const { customers, orders, users, sequelize } = require("../../models");
const { ok, fail, handle, toIso } = require("../../helper/helper");
const { saveLog } = require("../../utils/logHelper");

// Вэбээр (утас + OTP) нэвтэрсэн худалдан авагчид. Нэрийг худалдан авагч өөрөө вэбээс засна
// (анх "Зочин"), admin зөвхөн харна. admin/src/lib/api/customers.ts-ийн Customer
module.exports.list = handle("customerList", async (req, res) => {
  const rows = await customers.findAll({
    where: { shop_id: req.shopId, status: "active" },
    order: [["id", "desc"]],
    raw: true,
  });
  const counts = await orders.findAll({
    where: { shop_id: req.shopId, customer_id: rows.map((r) => r.id) },
    attributes: ["customer_id", [sequelize.fn("COUNT", sequelize.col("id")), "cnt"], [sequelize.fn("MAX", sequelize.col("created_at")), "last"]],
    group: ["customer_id"],
    raw: true,
  });
  const statOf = new Map(counts.map((c) => [c.customer_id, c]));
  const data = rows.map((r) => ({
    id: r.id,
    phone: r.phone,
    name: r.name,
    orderCount: Number(statOf.get(r.id)?.cnt ?? 0),
    lastOrderAt: toIso(statOf.get(r.id)?.last),
    createdAt: toIso(r.created_at),
  }));
  return ok(res, { rows: data, count: data.length, summary: [] });
});

// Захиалга үүсгээгүй худалдан авагчийг устгана (status = deleted); захиалгатай бол болохгүй.
// Тэр утсаар дахин нэвтэрвэл шинэ "Зочин" бүртгэл үүснэ. Нэвтэрсэн admin нууц үгээ
// дахин оруулж баталгаажуулна.
module.exports.destroy = handle("customerDestroy", async (req, res) => {
  const { by, at, password } = req.body;
  const admin = await users.findOne({ where: { id: by, shop_id: req.shopId, status: "active" } });
  const matches = admin?.password && (await bcrypt.compare(String(password ?? ""), admin.password));
  if (!matches) return fail(res, "Нууц үг буруу байна");

  const customer = await customers.findOne({ where: { id: req.params.id, shop_id: req.shopId, status: "active" } });
  if (!customer) return fail(res, "Худалдан авагч олдсонгүй");
  const orderCount = await orders.count({ where: { shop_id: req.shopId, customer_id: customer.id } });
  if (orderCount > 0) return fail(res, `Энэ худалдан авагч ${orderCount} захиалгатай тул устгах боломжгүй`);
  await customer.update({ status: "deleted", deleted_by: by, deleted_at: at });
  await saveLog({ shop_id: req.shopId, object_name: "customers", object_id: customer.id, log_action: "deleted", created_by: by, created_at: at });
  return ok(res, null);
});
