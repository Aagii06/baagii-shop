const bcrypt = require("bcryptjs");
const { users, stores, op } = require("../../models");
const { roles } = require("../../config/constants");
const { findStore } = require("../../helper/storeHelper");
const { saveLog } = require("../../utils/logHelper");
const { ok, fail, handle, toIso, phoneDigits } = require("../../helper/helper");

// Админ самбарын хэрэглэгчид: ADMIN (бүгдийг удирдана) эсвэл SHOPPER (дэлгүүр — зөвхөн
// өөрийн дэлгүүрийн бараа). admin/src/lib/api/users.ts-ийн User
const roleName = (role) => (role === roles.admin ? "admin" : "shopper");
const toRecord = (user) => ({
  id: user.id,
  name: user.name,
  phone: user.phone,
  email: user.email,
  role: roleName(user.role),
  store: user.store ? { id: user.store.id, name: user.store.name } : null,
  createdAt: toIso(user.created_at),
});

const withStore = [{ model: stores, as: "store", attributes: ["id", "name"], required: false, where: { status: "active" } }];
const findUser = (req, id) => users.findOne({ where: { id, shop_id: req.shopId, status: "active" }, include: withStore });

module.exports.list = handle("userList", async (req, res) => {
  const rows = await users.findAll({ where: { shop_id: req.shopId, status: "active" }, include: withStore, order: [["id", "asc"]] });
  return ok(res, { rows: rows.map(toRecord), count: rows.length, summary: [] });
});

module.exports.show = handle("userShow", async (req, res) => {
  const user = await findUser(req, req.params.id);
  return ok(res, user ? toRecord(user) : null);
});

// { name, phone, email?, role: "admin" | "shopper", storeId (shopper-т заавал), password (шинэд заавал) }
const fields = async (req, id = null) => {
  const { name, email, role, storeId } = req.body;
  const phone = phoneDigits(req.body.phone);
  const where = { shop_id: req.shopId, phone, status: "active", ...(id && { id: { [op.ne]: id } }) };
  if (await users.count({ where })) throw "Энэ утасны дугаар өөр хэрэглэгчид бүртгэлтэй байна";
  const isAdmin = role === "admin";
  if (!isAdmin && !(await findStore(req.shopId, storeId))) throw "Дэлгүүр сонгоно уу";
  return {
    name: name.trim(),
    username: phone,
    phone,
    email: email?.trim() || null,
    role: isAdmin ? roles.admin : roles.shopper,
    store_id: isAdmin ? null : Number(storeId),
  };
};

module.exports.create = handle("userCreate", async (req, res) => {
  const { by, at, password } = req.body;
  if (String(password ?? "").length < 6) return fail(res, "Нууц үг 6-аас дээш тэмдэгттэй байна");
  const values = await fields(req);
  const user = await users.create({
    ...values,
    password: await bcrypt.hash(String(password), 10),
    shop_id: req.shopId,
    status: "active",
    created_by: by,
    created_at: at,
  });
  await saveLog({ shop_id: req.shopId, object_name: "users", object_id: user.id, log_action: "created", created_by: by, created_at: at });
  return ok(res, toRecord(await findUser(req, user.id)));
});

// password өгвөл солино, хоосон бол хэвээр. Өөрийнхөө эрхийг бууруулж болохгүй.
module.exports.update = handle("userUpdate", async (req, res) => {
  const { by, at, password } = req.body;
  const user = await findUser(req, req.params.id);
  if (!user) return fail(res, "Хэрэглэгч олдсонгүй");
  if (user.id === by && req.body.role !== "admin") return fail(res, "Өөрийнхөө эрхийг өөрчлөх боломжгүй");
  if (password && String(password).length < 6) return fail(res, "Нууц үг 6-аас дээш тэмдэгттэй байна");
  const values = await fields(req, user.id);
  await user.update({
    ...values,
    ...(password && { password: await bcrypt.hash(String(password), 10) }),
    updated_by: by,
    updated_at: at,
  });
  await saveLog({ shop_id: req.shopId, object_name: "users", object_id: user.id, log_action: "updated", created_by: by, created_at: at });
  return ok(res, toRecord(await findUser(req, user.id)));
});

module.exports.destroy = handle("userDestroy", async (req, res) => {
  const { by, at } = req.body;
  const user = await findUser(req, req.params.id);
  if (!user) return fail(res, "Хэрэглэгч олдсонгүй");
  if (user.id === by) return fail(res, "Өөрийгөө устгах боломжгүй");
  await user.update({ status: "deleted", deleted_by: by, deleted_at: at });
  await saveLog({ shop_id: req.shopId, object_name: "users", object_id: user.id, log_action: "deleted", created_by: by, created_at: at });
  return ok(res, null);
});
