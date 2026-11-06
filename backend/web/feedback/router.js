const router = require("express").Router();
const { feedbacks } = require("../../models");
const { feedbackStatuses } = require("../../config/constants");
const { ok, handle, now, phoneDigits } = require("../../helper/helper");

// "Бидэнд бичнэ үү" (вэбийн /contact) маягт — нэвтрэхгүйгээр илгээнэ.
// { name, email, message, subject?, phone? } — baagii-shop гарчиг, AjrugShop утас асуудаг
const LIMITS = { name: 100, email: 150, phone: 20, subject: 200, message: 5000 };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Спамаас: нэг IP-ээс 10 минутад 5-аас ихгүй
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const recent = new Map();

const clientIp = (req) =>
  String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim() || req.socket?.remoteAddress || "";

const tooMany = (ip) => {
  const since = Date.now() - WINDOW_MS;
  const hits = (recent.get(ip) ?? []).filter((time) => time > since);
  if (hits.length >= MAX_PER_WINDOW) return true;
  hits.push(Date.now());
  recent.set(ip, hits);
  // Хуучирсан IP-үүдийг цэвэрлэнэ
  if (recent.size > 5000) for (const [key, times] of recent) if (!times.some((time) => time > since)) recent.delete(key);
  return false;
};

router.post(
  "/",
  handle("feedbackCreate", async (req, res) => {
    const body = {};
    for (const key of Object.keys(LIMITS)) body[key] = String(req.body?.[key] ?? "").trim();

    if (!body.name) throw "Нэрээ оруулна уу";
    if (!EMAIL.test(body.email)) throw "Имэйл хаягаа зөв оруулна уу";
    if (!body.message) throw "Мессежээ бичнэ үү";
    for (const [key, max] of Object.entries(LIMITS)) if (body[key].length > max) throw `Хэт урт байна (${max} тэмдэгтээс ихгүй)`;

    body.phone = phoneDigits(body.phone) || null;
    body.subject = body.subject || null;

    const ip = clientIp(req);
    if (tooMany(ip)) throw "Хэт олон удаа илгээлээ. Түр хүлээгээд дахин оролдоно уу";

    const at = now();
    await feedbacks.create({ shop_id: req.shopId, ...body, status: feedbackStatuses.new, ip, created_at: at, updated_at: at });
    return ok(res, null, "Таны санал хүсэлтийг хүлээн авлаа");
  }),
);

module.exports = router;
