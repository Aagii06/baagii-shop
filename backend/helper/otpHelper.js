const crypto = require("crypto");
const moment = require("moment");
const { phoneOtps } = require("../models");
const { now, parseAt, FORMAT } = require("./helper");

// Утсаар (SMS) нэг удаагийн код. SMS үйлчилгээ холбогдох хүртэл код нь бүх дугаарт
// OTP_DEV_CODE (анхдагч 2222) — илгээх хэсгийг deliver()-д холбоно.
const OTP_TTL_SECONDS = 10 * 60;
const OTP_RESEND_SECONDS = 30;
const OTP_MAX_ATTEMPTS = 5;

const hashOtp = (key, code) => crypto.createHmac("sha256", process.env.JWT_SECRET || "otp").update(`${key}:${code}`).digest("hex");
const secondsSince = (value) => (value ? moment().diff(parseAt(value), "seconds") : Infinity);

const deliver = async (phone, code) => {
  if (process.env.NODE_ENV !== "production") console.log(`OTP ${phone}: ${code}`);
};

module.exports.sendPhoneOtp = async (phone, purpose = "login") => {
  const where = { phone, purpose };
  const existing = await phoneOtps.findOne({ where });
  const wait = OTP_RESEND_SECONDS - secondsSince(existing?.sent_at);
  if (wait > 0) return { success: false, message: `${wait} секундын дараа дахин код авна уу` };

  const code = process.env.OTP_DEV_CODE || "2222";
  await deliver(phone, code);
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

module.exports.verifyPhoneOtp = async (phone, code, purpose = "login") => {
  const invalid = (message) => ({ success: false, message });
  const row = await phoneOtps.findOne({ where: { phone, purpose } });
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
