const bcrypt = require("bcryptjs");
const { users, stores } = require("../../models");
const { signUser, signPhoneProof, readPhoneProof } = require("../../middleware/auth");
const { roles } = require("../../config/constants");
const { Op } = require("sequelize");
const { ok, fail, handle, now, phoneDigits } = require("../../helper/helper");
const { sendPhoneOtp, verifyPhoneOtp } = require("../../helper/otpHelper");
const { sendCodeMail } = require("../../helper/mailHelper");
const { isPhoneBlocked, phoneVerifyFields, PHONE_BLOCKED_MESSAGE } = require("../../helper/phoneVerify");

const PHONE_CHANGE_OTP = "adminPhone";
// Одоогийн утасны дугаараа баталгаажуулах код (helper/phoneVerify.js)
const PHONE_VERIFY_OTP = "adminPhoneVerify";
// Нэвтрэх хуудаснаас нууц үгээ сэргээх код (бүртгэлтэй утас руу SMS)
const PASSWORD_RESET_OTP = "adminPasswordReset";
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
  ...phoneVerifyFields(user),
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
  if (isPhoneBlocked(user)) return fail(res, PHONE_BLOCKED_MESSAGE);
  return ok(res, { token: signUser(user), user: toUser(user) });
});

// { phone } — нууц үгээ мартсан: бүртгэлтэй бол тэр дугаар руу код илгээнэ. Бүртгэл байгаа эсэхийг
// задруулахгүйн тулд олдоогүй ч ижил хариу өгнө.
module.exports.sendResetOtp = handle("sendResetOtp", async (req, res) => {
  const phone = phoneDigits(req.body.phone);
  const user = await users.findOne({ where: { shop_id: req.shopId, phone, status: "active" }, attributes: ["id"] });
  if (!user) return ok(res, null, "Код илгээлээ");
  const result = await sendPhoneOtp(req.shopId, phone, PASSWORD_RESET_OTP);
  return res.status(200).json({ ...result, data: null });
});

// { phone, code } — кодыг шалгаад нууц үг солих 30 минутын токен (resetToken) буцаана
module.exports.verifyResetOtp = handle("verifyResetOtp", async (req, res) => {
  const phone = phoneDigits(req.body.phone);
  const user = await users.findOne({ where: { shop_id: req.shopId, phone, status: "active" }, attributes: ["id"] });
  if (!user) return fail(res, "Код буруу байна");
  const result = await verifyPhoneOtp(req.shopId, phone, req.body.code ?? "", PASSWORD_RESET_OTP);
  if (!result.success) return fail(res, result.message);
  return ok(res, { resetToken: signPhoneProof({ shopId: req.shopId, phone, purpose: PASSWORD_RESET_OTP }) });
});

// { resetToken, newPassword, confirmPassword } — баталгаажсан утасны хэрэглэгчийн нууц үгийг солино. Код утсанд
// ирсэн тул дугаарыг мөн баталгаажсан гэж тооцно (helper/phoneVerify.js).
module.exports.resetPassword = handle("resetPassword", async (req, res) => {
  const phone = readPhoneProof(req.body.resetToken, req.shopId, PASSWORD_RESET_OTP);
  if (!phone) return fail(res, "Хугацаа дууссан байна. Дахин код авна уу");
  const user = await users.findOne({ where: { shop_id: req.shopId, phone, status: "active" } });
  if (!user) return fail(res, "Хэрэглэгч олдсонгүй");
  const at = now();
  await user.update({
    password: await bcrypt.hash(String(req.body.newPassword), 10),
    ...(!user.phone_verified_at && { phone_verified_at: at }),
    updated_by: user.id,
    updated_at: at,
  });
  return ok(res, null, "Нууц үг шинэчлэгдлээ. Шинэ нууц үгээрээ нэвтэрнэ үү");
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
    // Шинэ дугаар кодоор баталгаажсан
    changes.phone_verified_at = changes.updated_at;
  }
  await user.update(changes);
  return ok(res, toUser(user));
});

// Одоогийн утасны дугаар руу баталгаажуулах код илгээнэ; verifyPhone-д code-оор баталгаажуулна
module.exports.sendVerifyPhoneOtp = handle("sendVerifyPhoneOtp", async (req, res) => {
  const user = await findMe(req);
  if (!user) return notFound(res);
  if (user.phone_verified_at) return fail(res, "Таны утасны дугаар баталгаажсан байна");
  const result = await sendPhoneOtp(req.shopId, user.phone, PHONE_VERIFY_OTP);
  return res.status(200).json({ ...result, data: null });
});

// { code } — одоогийн утсанд ирсэн кодоор дугаарыг баталгаажуулна
module.exports.verifyPhone = handle("verifyPhone", async (req, res) => {
  const user = await findMe(req);
  if (!user) return notFound(res);
  if (!user.phone_verified_at) {
    const result = await verifyPhoneOtp(req.shopId, user.phone, req.body.code ?? "", PHONE_VERIFY_OTP);
    if (!result.success) return fail(res, result.message);
    const at = now();
    await user.update({ phone_verified_at: at, updated_by: user.id, updated_at: at });
  }
  return ok(res, toUser(user), "Утасны дугаар баталгаажлаа");
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
  // Код зөвхөн тэр имэйл рүү очно (SMS биш). Имэйл тохируулаагүй бол dev-д код консолд хэвлэгдэнэ
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
