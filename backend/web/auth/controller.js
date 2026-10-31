const crypto = require("crypto");
const { customers, partnerRequests, sequelize } = require("../../models");
const { partnerStatuses } = require("../../config/constants");
const { signWeb } = require("../../middleware/auth");
const { sendPhoneOtp, verifyPhoneOtp } = require("../../helper/otpHelper");
const { mergeGuestCart } = require("../../helper/cartHelper");
const { ok, fail, handle, now, phoneDigits } = require("../../helper/helper");

// Анх бүртгүүлсэн худалдан авагчийн нэр (web/src/store/authStore.ts DEFAULT_PROFILE_NAME)
const DEFAULT_NAME = "Зочин";

const toCustomer = (customer) => ({ id: customer.id, phone: customer.phone, name: customer.name });

module.exports.loginGuest = handle("loginGuest", async (req, res) => {
  const guestId = crypto.randomUUID();
  return ok(res, { token: signWeb({ guestId }), guestId });
});

// Зочны токенд `{}`, утсаар нэвтэрсэн бол `{ customer }`
module.exports.getUserData = handle("getUserData", async (req, res) => {
  const { customerId } = req.session;
  if (!customerId) return ok(res, {});
  const customer = await customers.findOne({ where: { id: customerId, status: "active" } });
  return ok(res, customer ? { customer: toCustomer(customer) } : {});
});

module.exports.sendOtp = handle("sendOtp", async (req, res) => {
  const result = await sendPhoneOtp(phoneDigits(req.body.phone));
  return res.status(200).json({ ...result, data: null });
});

module.exports.verifyOtp = handle("verifyOtp", async (req, res) => {
  const phone = phoneDigits(req.body.phone);
  const result = await verifyPhoneOtp(phone, req.body.code);
  if (!result.success) return fail(res, result.message);

  const { guestId } = req.session;
  const t = await sequelize.transaction();
  try {
    const at = now();
    let customer = await customers.findOne({ where: { phone, status: "active" }, transaction: t });
    if (!customer) customer = await customers.create({ phone, name: DEFAULT_NAME, status: "active", created_at: at }, { transaction: t });
    await mergeGuestCart(guestId, customer.id, t);
    await t.commit();
    return ok(res, { token: signWeb({ guestId, customerId: customer.id }), customer: toCustomer(customer) });
  } catch (error) {
    await t.rollback();
    throw error;
  }
});

module.exports.updateMe = handle("updateMe", async (req, res) => {
  const customer = await customers.findOne({ where: { id: req.session.customerId, status: "active" } });
  if (!customer) return fail(res, "Хэрэглэгч олдсонгүй");
  await customer.update({ name: req.body.name.trim(), updated_by: customer.id, updated_at: now() });
  return ok(res, toCustomer(customer));
});

module.exports.register = handle("register", async (req, res) => {
  const phone = phoneDigits(req.body.userName);
  const existing = await partnerRequests.findOne({ where: { phone }, order: [["id", "desc"]] });
  if (existing?.status === partnerStatuses.pending) return fail(res, "Таны хүсэлт хүлээгдэж байна. Бид удахгүй холбогдоно");
  if (existing?.status === partnerStatuses.approved) return fail(res, "Энэ дугаар аль хэдийн бүртгэлтэй байна");
  await partnerRequests.create({ phone, status: partnerStatuses.pending, created_at: now() });
  return ok(res, null, "Хүсэлтийг хүлээн авлаа");
});
