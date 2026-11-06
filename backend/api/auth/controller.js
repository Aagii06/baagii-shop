const bcrypt = require("bcryptjs");
const { users, stores } = require("../../models");
const { signUser } = require("../../middleware/auth");
const { roles } = require("../../config/constants");
const { Op } = require("sequelize");
const { ok, fail, handle, now, phoneDigits } = require("../../helper/helper");
const { sendPhoneOtp, verifyPhoneOtp } = require("../../helper/otpHelper");
const { sendCodeMail } = require("../../helper/mailHelper");

const PHONE_CHANGE_OTP = "adminPhone";
// Имэйлийн кодыг phoneOtps-д имэйл хаягаар нь (phone баганад) хадгална
const EMAIL_CHANGE_OTP = "adminEmail";
// Нууц үг солих код — хэрэглэгчийн бүртгэлтэй имэйл рүү (имэйл хаягаар нь хадгална)
const PASSWORD_CHANGE_OTP = "adminPassword";

// admin/src/lib/api/auth.ts-ийн LoginUser / UserData.user
const toUser = (user) => ({
  id: user.id,
  name: user.name || user.phone,
  // Утасны дугаараар нэвтэрнэ
  userName: user.phone,
  phone: user.phone,
  email: user.email,
  logo: user.logo ?? null,
  roles: [],
  roleNames: user.role === roles.admin ? "admin" : "shopper",
  // SHOPPER-ийн дэлгүүр (include: store-оор ачаалсан үед)
  store: user.store ? { id: user.store.id, name: user.store.name } : null,
});

const withStore = [{ model: stores, as: "store", attributes: ["id", "name"], required: false, where: { status: "active" } }];

// { phone, password }
module.exports.login = handle("login", async (req, res) => {
  const { phone, password } = req.body;
  const user = await users.findOne({ where: { shop_id: req.shopId, phone: phoneDigits(phone), status: "active" }, include: withStore });
  const matches = user?.password && (await bcrypt.compare(password, user.password));
  if (!matches) return fail(res, "Утасны дугаар эсвэл нууц үг буруу байна");
  return ok(res, { token: signUser(user), user: toUser(user) });
});

module.exports.getUserData = handle("getUserData", async (req, res) => {
  const user = await users.findOne({ where: { id: req.loggedUser.id, shop_id: req.shopId, status: "active" }, include: withStore });
  if (!user) return res.status(401).json({ success: false, errorType: "authentication", message: "Хэрэглэгч олдсонгүй" });
  return ok(res, { user: toUser(user), menuPermission: null, customActionPermission: null, objectPermission: null });
});

const findMe = (req) => users.findOne({ where: { id: req.loggedUser.id, shop_id: req.shopId, status: "active" }, include: withStore });
const emailOf = (value) => value?.trim().toLowerCase() || null;
const notFound = (res) => res.status(401).json({ success: false, errorType: "authentication", message: "Хэрэглэгч олдсонгүй" });
const phoneTaken = (shopId, phone, userId) =>
  users.findOne({ where: { shop_id: shopId, phone, status: "active", id: { [Op.ne]: userId } } });

// { phone } — шинэ дугаар руу код илгээнэ; updateMe-д code-оор баталгаажуулна
module.exports.sendPhoneOtp = handle("sendPhoneOtp", async (req, res) => {
  const user = await findMe(req);
  if (!user) return notFound(res);
  const phone = phoneDigits(req.body.phone);
  if (phone === user.phone) return fail(res, "Энэ таны одоогийн дугаар байна");
  if (await phoneTaken(req.shopId, phone, user.id)) return fail(res, "Энэ утасны дугаар өөр хэрэглэгчид бүртгэлтэй байна");
  const result = await sendPhoneOtp(req.shopId, phone, PHONE_CHANGE_OTP);
  return res.status(200).json({ ...result, data: null });
});

// { name, phone, code?, email?, logo? }. Утас солиход шинэ дугаарт ирсэн code шаардана, имэйлийг changeEmail-ээр,
// нууц үгийг changePassword-оор
module.exports.updateMe = handle("updateMe", async (req, res) => {
  const user = await findMe(req);
  if (!user) return notFound(res);

  const phone = phoneDigits(req.body.phone);
  if (phone !== user.phone && (await phoneTaken(req.shopId, phone, user.id))) {
    return fail(res, "Энэ утасны дугаар өөр хэрэглэгчид бүртгэлтэй байна");
  }

  // Шинэ имэйлийг зөвхөн /me/email (кодоор) солино; энд хасах л боломжтой
  const email = emailOf(req.body.email);
  if (email && email !== emailOf(user.email)) return fail(res, "Шинэ имэйлээ кодоор баталгаажуулна уу");

  const changes = { name: req.body.name.trim(), phone, email: email ? user.email : null, updated_by: user.id, updated_at: now() };
  // logo илгээгээгүй бол хэвээр; null бол устгана
  if (req.body.logo !== undefined) changes.logo = req.body.logo || null;
  // Бусад шалгалт давсны дараа кодыг зарцуулна
  if (phone !== user.phone) {
    const result = await verifyPhoneOtp(req.shopId, phone, req.body.code ?? "", PHONE_CHANGE_OTP);
    if (!result.success) return fail(res, result.message);
  }
  await user.update(changes);
  return ok(res, toUser(user));
});

// Нууц үг солих: одоогийн нууц үг зөв, шинэ нь өөр, имэйл бүртгэлтэй эсэхийг шалгана. Алдааг string-ээр шиднэ.
const checkPasswordChange = async (user, { password, newPassword }) => {
  if (!user.email) throw "Эхлээд профайлдаа имэйл хаягаа баталгаажуулж нэмнэ үү";
  const matches = user.password && (await bcrypt.compare(String(password ?? ""), user.password));
  if (!matches) throw "Одоогийн нууц үг буруу байна";
  if (await bcrypt.compare(String(newPassword), user.password)) throw "Шинэ нууц үг одоогийнхоос өөр байна";
};

// { password, newPassword } — шалгаад бүртгэлтэй имэйл рүү код илгээнэ; changePassword-д code-оор солино
module.exports.sendPasswordOtp = handle("sendPasswordOtp", async (req, res) => {
  const user = await findMe(req);
  if (!user) return notFound(res);
  await checkPasswordChange(user, req.body);
  const mailReady = Boolean(process.env.MAIL_USER_NAME && process.env.MAIL_USER_PASS);
  if (!mailReady && process.env.NODE_ENV === "production") return fail(res, "Имэйл илгээх тохиргоо хийгдээгүй байна");
  const email = emailOf(user.email);
  const send = mailReady
    ? (code) =>
        sendCodeMail(req.shopId, email, {
          title: "Нууц үг солих код",
          intro: "Таны бүртгэлийн нууц үгийг солих хүсэлт ирлээ. Доорх кодыг оруулж баталгаажуулна уу. Хэрэв та хүсэлт гаргаагүй бол нууц үгээ даруй солино уу.",
          code,
        })
    : null;
  const result = await sendPhoneOtp(req.shopId, email, PASSWORD_CHANGE_OTP, send);
  // Аль хаяг руу явсныг харуулахад (жишээ нь b***@gmail.com)
  return res.status(200).json({ ...result, data: result.success ? { email: maskEmail(email) } : null });
});

// { password, newPassword, code } — имэйлд ирсэн кодоор баталгаажуулж нууц үгийг солино
module.exports.changePassword = handle("changePassword", async (req, res) => {
  const user = await findMe(req);
  if (!user) return notFound(res);
  await checkPasswordChange(user, req.body);
  const result = await verifyPhoneOtp(req.shopId, emailOf(user.email), req.body.code ?? "", PASSWORD_CHANGE_OTP);
  if (!result.success) return fail(res, result.message);
  await user.update({ password: await bcrypt.hash(String(req.body.newPassword), 10), updated_by: user.id, updated_at: now() });
  return ok(res, null, "Нууц үг солигдлоо");
});

// "bataa@gmail.com" → "b***a@gmail.com"
const maskEmail = (email) => {
  const [local, domain] = String(email).split("@");
  if (!domain) return email;
  return `${local.length <= 2 ? local[0] : local[0] + "***" + local.slice(-1)}@${domain}`;
};

const sendEmailCode = (shopId, email, code) =>
  sendCodeMail(shopId, email, {
    title: "Имэйл баталгаажуулах код",
    intro: "Таны бүртгэлийн имэйл хаягийг солих хүсэлт ирлээ. Доорх кодыг оруулж баталгаажуулна уу.",
    code,
  });

// { email } — шинэ имэйл рүү код илгээнэ; changeEmail-д code-оор баталгаажуулна
module.exports.sendEmailOtp = handle("sendEmailOtp", async (req, res) => {
  const user = await findMe(req);
  if (!user) return notFound(res);
  const email = emailOf(req.body.email);
  if (email === emailOf(user.email)) return fail(res, "Энэ таны одоогийн имэйл байна");
  // Код зөвхөн тэр имэйл рүү очно (SMS биш). Имэйл тохируулаагүй бол dev-д OTP_DEV_CODE ажиллана
  const mailReady = Boolean(process.env.MAIL_USER_NAME && process.env.MAIL_USER_PASS);
  if (!mailReady && process.env.NODE_ENV === "production") return fail(res, "Имэйл илгээх тохиргоо хийгдээгүй байна");
  const send = mailReady ? (code) => sendEmailCode(req.shopId, email, code) : null;
  const result = await sendPhoneOtp(req.shopId, email, EMAIL_CHANGE_OTP, send);
  return res.status(200).json({ ...result, data: null });
});

// { email, code } — кодоо зөв оруулбал имэйлийг шууд солино
module.exports.changeEmail = handle("changeEmail", async (req, res) => {
  const user = await findMe(req);
  if (!user) return notFound(res);
  const email = emailOf(req.body.email);
  const result = await verifyPhoneOtp(req.shopId, email, req.body.code ?? "", EMAIL_CHANGE_OTP);
  if (!result.success) return fail(res, result.message);
  await user.update({ email, updated_by: user.id, updated_at: now() });
  return ok(res, toUser(user));
});
