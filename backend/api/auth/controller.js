const bcrypt = require("bcryptjs");
const { users } = require("../../models");
const { signUser } = require("../../middleware/auth");
const { roles } = require("../../config/constants");
const { ok, fail, handle, phoneDigits } = require("../../helper/helper");

// admin/src/lib/api/auth.ts-ийн LoginUser / UserData.user
const toUser = (user) => ({
  id: user.id,
  name: user.name || user.phone,
  // Утасны дугаараар нэвтэрнэ
  userName: user.phone,
  phone: user.phone,
  email: user.email,
  roles: [],
  roleNames: user.role === roles.admin ? "admin" : "shopper",
});

// { phone, password }
module.exports.login = handle("login", async (req, res) => {
  const { phone, password } = req.body;
  const user = await users.findOne({ where: { shop_id: req.shopId, phone: phoneDigits(phone), status: "active" } });
  const matches = user?.password && (await bcrypt.compare(password, user.password));
  if (!matches) return fail(res, "Утасны дугаар эсвэл нууц үг буруу байна");
  return ok(res, { token: signUser(user), user: toUser(user) });
});

module.exports.getUserData = handle("getUserData", async (req, res) => {
  const user = await users.findOne({ where: { id: req.loggedUser.id, shop_id: req.shopId, status: "active" } });
  if (!user) return res.status(401).json({ success: false, errorType: "authentication", message: "Хэрэглэгч олдсонгүй" });
  return ok(res, { user: toUser(user), menuPermission: null, customActionPermission: null, objectPermission: null });
});
