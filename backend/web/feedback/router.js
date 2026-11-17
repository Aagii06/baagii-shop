const router = require("express").Router();
const { feedbacks } = require("../../models");
const { feedbackStatuses } = require("../../config/constants");
const { ok, handle, now, phoneDigits } = require("../../helper/helper");
const { notify } = require("../../helper/notificationHelper");
const { verifyRecaptcha } = require("../../helper/recaptchaHelper");
const { clientIp } = require("../../middleware/rateLimit");

// "Бидэнд бичнэ үү" (вэбийн /contact) маягт — нэвтрэхгүйгээр илгээнэ.
// { name, email, message, subject?, phone?, recaptchaToken, website, fillMs } — baagii-shop гарчиг, AjrugShop утас асуудаг
const LIMITS = { name: 100, email: 150, phone: 20, subject: 200, message: 5000 };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Спамаас: нэг IP-ээс 10 минутад 5-аас ихгүй
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const recent = new Map();

// Bot шалгалт: website — нүдэнд үл харагдах талбар (хүн бөглөхгүй),
// fillMs — хуудас нээгдсэнээс хойш илгээх хүртэлх хугацаа (мс)
const MIN_FILL_MS = 3000;
// Spam-ийн ихэнх нь холбоостой ирдэг
const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|ru|info|xyz|top|site|online|biz|io|link|click|shop|store|pro|cc|me)\b)/i;

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
    // Bot-д амжилттай гэж хариулна — хадгалахгүй, давтан оролдох шалтгаан өгөхгүй
    if (String(req.body?.website ?? "").trim()) return ok(res, null, "Таны санал хүсэлтийг хүлээн авлаа");
    const fillMs = Number(req.body?.fillMs);
    if (!Number.isFinite(fillMs)) throw "Хуудсаа дахин ачаалаад илгээнэ үү";
    if (fillMs < MIN_FILL_MS) return ok(res, null, "Таны санал хүсэлтийг хүлээн авлаа");

    const body = {};
    for (const key of Object.keys(LIMITS)) body[key] = String(req.body?.[key] ?? "").trim();

    if (!body.name) throw "Нэрээ оруулна уу";
    if (!EMAIL.test(body.email)) throw "Имэйл хаягаа зөв оруулна уу";
    if (!body.message) throw "Мессежээ бичнэ үү";
    for (const [key, max] of Object.entries(LIMITS)) if (body[key].length > max) throw `Хэт урт байна (${max} тэмдэгтээс ихгүй)`;

    if ([body.name, body.subject, body.message].some((text) => LINK.test(text))) throw "Мессежид холбоос (линк) оруулах боломжгүй";

    body.phone = phoneDigits(body.phone) || null;
    body.subject = body.subject || null;

    const ip = clientIp(req);
    if (tooMany(ip)) throw "Хэт олон удаа илгээлээ. Түр хүлээгээд дахин оролдоно уу";
    await verifyRecaptcha(req.body?.recaptchaToken, ip);

    const at = now();
    await feedbacks.create({ shop_id: req.shopId, ...body, status: feedbackStatuses.new, ip, created_at: at, updated_at: at });
    notify({
      shopId: req.shopId,
      type: "feedback",
      title: body.subject ? `Санал хүсэлт: ${body.subject}` : "Шинэ санал хүсэлт",
      body: `${body.name} · ${body.message.slice(0, 120)}`,
      link: "/feedbacks",
    });
    return ok(res, null, "Таны санал хүсэлтийг хүлээн авлаа");
  }),
);

module.exports = router;
