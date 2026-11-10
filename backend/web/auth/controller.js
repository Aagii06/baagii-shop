const crypto = require("crypto");
const { customers, partnerRequests, users, sequelize } = require("../../models");
const { partnerStatuses } = require("../../config/constants");
const { signWeb, signPhoneProof, readPhoneProof } = require("../../middleware/auth");
const { sendPhoneOtp, verifyPhoneOtp } = require("../../helper/otpHelper");
const { mergeGuestCart } = require("../../helper/cartHelper");
const { ok, fail, handle, now, phoneDigits } = require("../../helper/helper");

// Анх бүртгүүлсэн худалдан авагчийн нэр (web/src/store/authStore.ts DEFAULT_PROFILE_NAME)
const DEFAULT_NAME = "Зочин";

const toCustomer = (customer) => ({ id: customer.id, phone: customer.phone, name: customer.name });

module.exports.loginGuest = handle("loginGuest", async (req, res) => {
  const guestId = crypto.randomUUID();
  return ok(res, { token: signWeb({ shopId: req.shopId, guestId }), guestId });
});

// Зочны токенд `{}`, утсаар нэвтэрсэн бол `{ customer, isStaff }`.
// isStaff — энэ утсаар админ эсвэл дэлгүүрийн (shopper) хэрэглэгч бүртгэлтэй эсэх;
// апп зөвхөн тэр үед "Админ хэсэг рүү орох"-ыг харуулна.
module.exports.getUserData = handle("getUserData", async (req, res) => {
  const { customerId } = req.session;
  if (!customerId) return ok(res, {});
  const customer = await customers.findOne({ where: { id: customerId, shop_id: req.shopId, status: "active" } });
  if (!customer) return ok(res, {});
  const isStaff = (await users.count({ where: { shop_id: req.shopId, phone: customer.phone, status: "active" } })) > 0;
  return ok(res, { customer: toCustomer(customer), isStaff });
});

module.exports.sendOtp = handle("sendOtp", async (req, res) => {
  const result = await sendPhoneOtp(req.shopId, phoneDigits(req.body.phone));
  return res.status(200).json({ ...result, data: null });
});

module.exports.verifyOtp = handle("verifyOtp", async (req, res) => {
  const phone = phoneDigits(req.body.phone);
  const result = await verifyPhoneOtp(req.shopId, phone, req.body.code);
  if (!result.success) return fail(res, result.message);

  const { guestId } = req.session;
  const t = await sequelize.transaction();
  try {
    const at = now();
    let customer = await customers.findOne({ where: { shop_id: req.shopId, phone, status: "active" }, transaction: t });
    if (!customer) customer = await customers.create({ shop_id: req.shopId, phone, name: DEFAULT_NAME, status: "active", created_at: at }, { transaction: t });
    await mergeGuestCart(req.shopId, guestId, customer.id, t);
    await t.commit();
    return ok(res, { token: signWeb({ shopId: req.shopId, guestId, customerId: customer.id }), customer: toCustomer(customer) });
  } catch (error) {
    await t.rollback();
    throw error;
  }
});

module.exports.updateMe = handle("updateMe", async (req, res) => {
  const customer = await customers.findOne({ where: { id: req.session.customerId, shop_id: req.shopId, status: "active" } });
  if (!customer) return fail(res, "Хэрэглэгч олдсонгүй");
  await customer.update({ name: req.body.name.trim(), updated_by: customer.id, updated_at: now() });
  return ok(res, toCustomer(customer));
});

const PARTNER_OTP = "partner";

// Хүсэлтийн өмнө давхардлыг шалгаж, дараа нь код илгээнэ — хүлээгдэж буй дугаарт код дэмий явахгүй
const partnerBlocked = async (shopId, phone) => {
  const existing = await partnerRequests.findOne({ where: { shop_id: shopId, phone }, order: [["id", "desc"]] });
  if (existing?.status === partnerStatuses.pending) return "Таны хүсэлт хүлээгдэж байна. Бид удахгүй холбогдоно";
  if (existing?.status === partnerStatuses.approved) return "Энэ дугаар аль хэдийн бүртгэлтэй байна";
  return null;
};

module.exports.sendRegisterOtp = handle("sendRegisterOtp", async (req, res) => {
  const phone = phoneDigits(req.body.phone);
  const blocked = await partnerBlocked(req.shopId, phone);
  if (blocked) return fail(res, blocked);
  const result = await sendPhoneOtp(req.shopId, phone, PARTNER_OTP);
  return res.status(200).json({ ...result, data: null });
});

// { phone, code } — кодыг шалгаад phoneToken буцаана; register-т кодын оронд үүнийг илгээнэ.
// Утас эхлээд баталгаажсаны дараа л вэб дэлгүүрийн мэдээллийг асууна.
module.exports.verifyRegisterOtp = handle("verifyRegisterOtp", async (req, res) => {
  const phone = phoneDigits(req.body.phone);
  const blocked = await partnerBlocked(req.shopId, phone);
  if (blocked) return fail(res, blocked);
  const result = await verifyPhoneOtp(req.shopId, phone, req.body.code ?? "", PARTNER_OTP);
  if (!result.success) return fail(res, result.message);
  return ok(res, { phoneToken: signPhoneProof({ shopId: req.shopId, phone, purpose: PARTNER_OTP }) });
});

// { userName (утас), phoneToken, storeName, name, email?, address? }. Утсыг үргэлж SMS кодоор
// баталгаажуулна (register/sendOtp → register/verifyOtp) — нэвтэрсэн худалдан авагч ч гэсэн.
module.exports.register = handle("register", async (req, res) => {
  const phone = phoneDigits(req.body.userName);
  if (readPhoneProof(req.body.phoneToken, req.shopId, PARTNER_OTP) !== phone)
    return fail(res, "Утасны дугаараа кодоор дахин баталгаажуулна уу");
  const blocked = await partnerBlocked(req.shopId, phone);
  if (blocked) return fail(res, blocked);

  const { storeName, name, email, address } = req.body;
  await partnerRequests.create({
    shop_id: req.shopId,
    phone,
    store_name: storeName.trim(),
    name: name.trim(),
    email: email?.trim() || null,
    address: address?.trim() || null,
    status: partnerStatuses.pending,
    created_at: now(),
  });
  return ok(res, null, "Хүсэлтийг хүлээн авлаа");
});
