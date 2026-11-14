const { fail } = require("../helper/helper");

// IP тутамд хүсэлтийн хязгаар. Санах ойд хадгална (backend нэг процесс).
// Backend nginx-ийн ард ажилладаг. X-Forwarded-For-ийн ЭХНИЙ утгыг хэрэглэгч өөрөө бичиж хуурч болно,
// харин СҮҮЛИЙН утгыг nginx ($proxy_add_x_forwarded_for) өөрөө нэмдэг тул түүнийг авна.
const clientIp = (req) =>
  String(req.headers["x-real-ip"] ?? "").trim() ||
  String(req.headers["x-forwarded-for"] ?? "").split(",").pop().trim() ||
  req.socket?.remoteAddress ||
  "";
module.exports.clientIp = clientIp;

const rateLimit = ({ windowMs, max, message }) => {
  const hits = new Map();
  return (req, res, next) => {
    const ip = clientIp(req);
    const since = Date.now() - windowMs;
    const times = (hits.get(ip) ?? []).filter((time) => time > since);
    if (times.length >= max) return fail(res, message);
    times.push(Date.now());
    hits.set(ip, times);
    // Хуучирсан IP-үүдийг цэвэрлэнэ
    if (hits.size > 5000) for (const [key, list] of hits) if (!list.some((time) => time > since)) hits.delete(key);
    next();
  };
};
module.exports.rateLimit = rateLimit;

// Код (SMS/имэйл) илгээх бүх endpoint нэг хязгаарыг хуваалцана: нэг IP-ээс цагт 10
module.exports.otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Хэт олон удаа код хүслээ. Түр хүлээгээд дахин оролдоно уу",
});
