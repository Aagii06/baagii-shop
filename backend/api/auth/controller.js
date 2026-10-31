const bcrypt = require("bcryptjs");
const { users } = require("../../models");
const { signUser } = require("../../middleware/auth");
const { roles } = require("../../config/constants");
const { ok, fail, handle } = require("../../helper/helper");

// admin/src/lib/api/auth.ts-ийн LoginUser / UserData.user
const toUser = (user) => ({
  id: user.id,
  name: user.name || user.username,
  userName: user.username,
  phone: user.phone,
  email: user.email,
  roles: [],
  roleNames: user.role === roles.admin ? "admin" : "shopper",
});

module.exports.login = handle("login", async (req, res) => {
  const { userName, password } = req.body;
  const user = await users.findOne({ where: { username: userName.trim(), status: "active" } });
  const matches = user?.password && (await bcrypt.compare(password, user.password));
  if (!matches) return fail(res, "Нэвтрэх нэр эсвэл нууц үг буруу байна");
  return ok(res, { token: signUser(user), user: toUser(user) });
});

module.exports.getUserData = handle("getUserData", async (req, res) => {
  const user = await users.findOne({ where: { id: req.loggedUser.id, status: "active" } });
  if (!user) return res.status(401).json({ success: false, errorType: "authentication", message: "Хэрэглэгч олдсонгүй" });
  return ok(res, { user: toUser(user), menuPermission: null, customActionPermission: null, objectPermission: null });
});
