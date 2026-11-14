const crypto = require("crypto");
const moment = require("moment");
const { phoneOtps, shops } = require("../models");
const { now, parseAt, FORMAT } = require("./helper");
const { isSmsConfigured, sendSms } = require("./smsHelper");

// Утсаар (SMS) нэг удаагийн код. SMS-ийг Android утсан дээрх gateway app илгээнэ
// (helper/smsHelper.js). Код үргэлж санамсаргүй. SMS_GATEWAY_TOKEN тохируулаагүй үед
// production-д код илгээхгүй (алдаа буцаана), dev орчинд кодыг консолд хэвлэнэ.
const OTP_TTL_SECONDS = 10 * 60;
const OTP_RESEND_SECONDS = 30;
const OTP_MAX_ATTEMPTS = 5;

const hashOtp = (key, code) => crypto.createHmac("sha256", process.env.JWT_SECRET || "otp").update(`${key}:${code}`).digest("hex");
const secondsSince = (value) => (value ? moment().diff(parseAt(value), "seconds") : Infinity);

const PHONE_OTP_LENGTH = 4;
const newPhoneOtp = () => String(crypto.randomInt(0, 10 ** PHONE_OTP_LENGTH)).padStart(PHONE_OTP_LENGTH, "0");

const purposeText = { login: "нэвтрэх код", partner: "бүртгэлийн код" };

// SMS-ээр илгээнэ. Gateway (утас) холбогдоогүй бол алдааны мессеж буцаана.
const deliver = async (shopId, phone, purpose, code) => {
  if (!isSmsConfigured()) {
    if (process.env.NODE_ENV === "production") return "SMS үйлчилгээ одоогоор ажиллахгүй байна";
    console.log(`[dev, sms холбогдоогүй] OTP ${phone}: ${code}`);
    return null;
  }
  const shop = await shops.findOne({ where: { id: shopId }, attributes: ["name"], raw: true });
  const label = purposeText[purpose.split(":")[0]] || "баталгаажуулах код";
  try {
    await sendSms(phone, `${shop?.name ? `${shop.name} ` : ""}${label}: ${code}`);
    return null;
  } catch (error) {
    return error.message;
  }
};

// Код нь дэлгүүр бүрт тусдаа (нэг дугаар хоёр дэлгүүрт өөр өөр хэрэглэгч).
// send(code) өгвөл (жишээ нь имэйл) санамсаргүй 6 оронтой кодыг түүгээр илгээнэ; false буцаавал алдаа.
// send === null — SMS биш суваг (имэйл) тохируулаагүй (зөвхөн dev): санамсаргүй кодыг консолд хэвлэнэ.
// Нэг дугаар руу зэрэг ирсэн хүсэлтүүд cooldown шалгалтыг хамт давж олон код илгээхээс сэргийлнэ
const inFlight = new Set();

module.exports.sendPhoneOtp = async (shopId, phone, purpose = "login", send) => {
  const key = `${shopId}:${phone}:${purpose}`;
  if (inFlight.has(key)) return { success: false, message: `${OTP_RESEND_SECONDS} секундын дараа дахин код авна уу` };
  inFlight.add(key);
  try {
    return await sendOtp(shopId, phone, purpose, send);
  } finally {
    inFlight.delete(key);
  }
};

const sendOtp = async (shopId, phone, purpose, send) => {
  const where = { shop_id: shopId, phone, purpose };
  const existing = await phoneOtps.findOne({ where });
  const wait = OTP_RESEND_SECONDS - secondsSince(existing?.sent_at);
  if (wait > 0) return { success: false, message: `${wait} секундын дараа дахин код авна уу` };

  let code;
  if (send === null) {
    if (process.env.NODE_ENV === "production") return { success: false, message: "Код илгээх тохиргоо хийгдээгүй байна" };
    code = String(crypto.randomInt(100000, 1000000));
    console.log(`[dev, суваг тохируулаагүй] OTP ${phone}: ${code}`);
  } else if (send) {
    code = String(crypto.randomInt(100000, 1000000));
    if (!(await send(code))) return { success: false, message: "Код илгээж чадсангүй. Дахин оролдоно уу" };
  } else {
    code = newPhoneOtp();
    const error = await deliver(shopId, phone, purpose, code);
    if (error) return { success: false, message: error };
  }
  const at = now();
  const values = {
    otp_hash: hashOtp(phone, code),
    expires_at: parseAt(at).add(OTP_TTL_SECONDS, "seconds").format(FORMAT),
    sent_at: at,
    attempts: 0,
    updated_at: at,
  };
  if (existing) await existing.update(values);
  else await phoneOtps.create({ ...where, ...values, created_at: at });
  return { success: true, message: "Код илгээлээ" };
};

module.exports.verifyPhoneOtp = async (shopId, phone, code, purpose = "login") => {
  const invalid = (message) => ({ success: false, message });
  const row = await phoneOtps.findOne({ where: { shop_id: shopId, phone, purpose } });
  if (!row) return invalid("Эхлээд код авна уу");
  if (row.attempts >= OTP_MAX_ATTEMPTS) return invalid("Оролдлого хэтэрлээ. Шинэ код авна уу");
  if (moment().isAfter(parseAt(row.expires_at))) return invalid("Кодын хугацаа дууссан. Шинэ код авна уу");
  const matches = crypto.timingSafeEqual(Buffer.from(hashOtp(phone, String(code).trim())), Buffer.from(row.otp_hash));
  if (!matches) {
    await row.increment("attempts");
    return invalid("Код буруу байна");
  }
  await row.destroy();
  return { success: true, message: "" };
};
