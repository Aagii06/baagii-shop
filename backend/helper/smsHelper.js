const crypto = require("crypto");
const moment = require("moment");
const { smsOutbox, op } = require("../models");

// SMS илгээх үйлчилгээ: Android утсан дээрх SMS gateway app (sms_gateway_app) өөрийн SIM-ээр илгээнэ.
//   1. sendSms мессежийг sms_outbox-д "pending" төлөвтэй хийнэ
//   2. Утас GET /api/sms-gateway/pending-ээр (long-poll) татаж аваад илгээнэ
//   3. Утас POST /api/sms-gateway/:id/status-аар үр дүнгээ мэдээлнэ
//
// .env-д SMS_GATEWAY_TOKEN тохируулаагүй бол isSmsConfigured() false - утасны OTP нь
// OTP_DEV_CODE (анхдагч "2222") тогтмол кодыг ашиглана (helper/otpHelper.js).
// Хоёр дэлгүүр нэг gateway (нэг утас)-г хуваалцана.

const { now, FORMAT } = require("./helper");

const ago = (seconds) => moment().utcOffset("+0800").subtract(seconds, "seconds").format(FORMAT);

// Үүнээс хуучин мессежийг илгээхгүй (OTP 10 минутын дараа хүчингүй)
const MAX_AGE_SECONDS = 10 * 60;
// "sending" төлөвтэй ийм удаан үлдвэл (утас унтарсан г.м.) дахин өгнө
const SENDING_TIMEOUT_SECONDS = 2 * 60;
const MAX_ATTEMPTS = 3;
// Утас сүүлд ийм хугацаанд холбогдоогүй бол gateway салсан гэж үзнэ
const GATEWAY_ONLINE_SECONDS = 90;

module.exports.isSmsConfigured = () => Boolean(process.env.SMS_GATEWAY_TOKEN);

module.exports.checkGatewayToken = (token) => {
  const expected = process.env.SMS_GATEWAY_TOKEN;
  if (!expected || typeof token !== "string") return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// --- Утасны холболт (long-poll) -----------------------------------------------
// Нэг процесс доторх төлөв: pending хүлээж буй утасны хүсэлтүүд, сүүлд холбогдсон цаг
let lastSeenAt = 0;
const waiters = new Set();

module.exports.touchGateway = () => {
  lastSeenAt = Date.now();
};
const isGatewayOnline = () => Date.now() - lastSeenAt < GATEWAY_ONLINE_SECONDS * 1000;
module.exports.isGatewayOnline = isGatewayOnline;

// Шинэ мессеж ирэх хүртэл (хамгийн ихдээ ms) хүлээнэ
module.exports.waitForSms = (ms) =>
  new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      waiters.delete(done);
      resolve();
    };
    const timer = setTimeout(done, ms);
    waiters.add(done);
  });

const wakeGateway = () => [...waiters].forEach((done) => done());

// Илгээх ёстой мессежүүдийг авч "sending" болгоно
module.exports.takePendingSms = async (limit = 10) => {
  const rows = await smsOutbox.findAll({
    where: {
      created_at: { [op.gte]: ago(MAX_AGE_SECONDS) },
      attempts: { [op.lt]: MAX_ATTEMPTS },
      [op.or]: [{ status: "pending" }, { status: "sending", updated_at: { [op.lt]: ago(SENDING_TIMEOUT_SECONDS) } }],
    },
    order: [["id", "ASC"]],
    limit,
  });
  const at = now();
  for (const row of rows) await row.update({ status: "sending", attempts: row.attempts + 1, updated_at: at });
  return rows.map(({ id, phonenumber, text }) => ({ id, phonenumber, text }));
};

// Утас илгээсэн үр дүнгээ мэдээлнэ. status: "sent" | "failed"
module.exports.reportSms = async (id, status, error) => {
  const row = await smsOutbox.findOne({ where: { id } });
  if (!row) return false;
  const at = now();
  await row.update({
    status,
    error: status === "failed" ? String(error || "").slice(0, 255) || null : null,
    ...(status === "sent" && { sent_at: at }),
    updated_at: at,
  });
  return true;
};

// phonenumber: 8 оронтой дугаар. Gateway холбогдоогүй бол алдаа шиднэ.
// Дараалалд хийгээд шууд буцна - утас хэдэн секундын дотор илгээнэ.
module.exports.sendSms = async (phonenumber, text) => {
  if (!isGatewayOnline()) throw new Error("SMS илгээх утас холбогдоогүй байна. Түр хүлээгээд дахин оролдоно уу");
  const at = now();
  await smsOutbox.create({ phonenumber, text, status: "pending", attempts: 0, created_at: at, updated_at: at });
  wakeGateway();
};
