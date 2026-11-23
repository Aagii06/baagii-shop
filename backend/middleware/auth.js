const jwt = require("jsonwebtoken");
const { roles } = require("../config/constants");

const sign = (payload, expiresIn) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

// Токен бүр нэг дэлгүүрийнх (shopId): өөр дэлгүүрийн X-Shop-Id-тай ирвэл хүчингүй.

// Нэвтэрсэн эрх (админ/борлуулагч, утсаар нэвтэрсэн худалдан авагч) сүүлийн үйлдлээс
// хойш 14 хоног хүчинтэй: хүсэлт бүрт (цагт нэгээс олонгүй) шинэ токен
// `X-Refresh-Token` толгойгоор буцаж, клиент хадгалсан токеноо солино.
const SESSION_TTL = "14d";
const REFRESH_AFTER_SEC = 60 * 60;

// Админ самбар (users хүснэгт)
module.exports.signUser = (user) => sign({ shopId: user.shop_id, user: { id: user.id, role: user.role } }, SESSION_TTL);

// Вэб: зочин бүр guestId-тай (сагс үүгээр холбогдоно), утсаар нэвтэрсэн бол customerId нэмэгдэнэ
module.exports.signWeb = ({ shopId, guestId, customerId = null }) =>
  sign({ shopId, guestId, customerId }, customerId ? SESSION_TTL : "2d");

// Хүчинтэй нэвтэрсэн токен цагаас хуучин бол шинэ 14 хоногийн токен толгойд нэмнэ.
// Зочны токен (customerId-гүй) сунгагдахгүй.
const refreshSession = (res, payload) => {
  if (!payload?.user && !payload?.customerId) return;
  if (Date.now() / 1000 - (payload.iat ?? 0) < REFRESH_AFTER_SEC) return;
  const { iat, exp, ...rest } = payload;
  res.setHeader("X-Refresh-Token", sign(rest, SESSION_TTL));
};

// SMS кодоор баталгаажсан утас: дараагийн алхам (жишээ нь хамтран ажиллах хүсэлт) кодыг
// дахин шаардахгүйгээр энэ токеноор утсыг нотолно. 30 минут хүчинтэй.
module.exports.signPhoneProof = ({ shopId, phone, purpose }) => sign({ shopId, phoneProof: { phone, purpose } }, "30m");

// Хүчинтэй бол баталгаажсан утас, үгүй бол null
module.exports.readPhoneProof = (token, shopId, purpose) => {
  try {
    const payload = jwt.verify(String(token ?? ""), process.env.JWT_SECRET);
    return payload.shopId === shopId && payload.phoneProof?.purpose === purpose ? payload.phoneProof.phone : null;
  } catch (error) {
    return null;
  }
};

// Токеноос payload-ийг уншина; байхгүй / буруу / хугацаа дууссан / өөр дэлгүүрийнх бол null
const readToken = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload.shopId === req.shopId ? payload : null;
  } catch (error) {
    return null;
  }
};

module.exports.readToken = readToken;

const unauthorized = (res) =>
  res.status(401).json({ success: false, errorType: "authentication", message: "Систем рүү нэвтэрнэ үү" });

// Админ / борлуулагч. Вэбийн токен энд хүчингүй. Утсаа хугацаанд нь баталгаажуулаагүй
// (helper/phoneVerify.js) хэрэглэгчийн токен хүчингүй — 401-ээр гаргана.
module.exports.protect = async (req, res, next) => {
  const payload = readToken(req);
  if (!payload?.user) return unauthorized(res);
  req.loggedUser = payload.user;
  refreshSession(res, payload);
  try {
    const { users } = require("../models");
    const { isPhoneBlocked, PHONE_BLOCKED_MESSAGE } = require("../helper/phoneVerify");
    const user = await users.findOne({
      where: { id: payload.user.id, shop_id: req.shopId, status: "active" },
      attributes: ["id", "role", "phone_verified_at", "phone_verify_deadline"],
    });
    if (user && isPhoneBlocked(user)) {
      return res.status(401).json({ success: false, errorType: "authentication", message: PHONE_BLOCKED_MESSAGE });
    }
  } catch (error) {
    return next(error);
  }
  next();
};

// protect-ийн дараа ашиглана
module.exports.isAdmin = (req, res, next) => {
  if (req.loggedUser?.role === roles.admin) return next();
  return res.status(200).json({ success: false, message: "Танд энэ үйлдлийг хийх эрх байхгүй" });
};

// Вэбийн зочин эсвэл утсаар нэвтэрсэн худалдан авагч (/web/auth/loginGuest-ээр авсан токен)
module.exports.protectWeb = (req, res, next) => {
  const payload = readToken(req);
  if (!payload?.guestId) return unauthorized(res);
  req.session = { shopId: req.shopId, guestId: payload.guestId, customerId: payload.customerId ?? null };
  refreshSession(res, payload);
  next();
};

// protectWeb-ийн дараа: утсаар нэвтэрсэн байх ёстой. Зочны токен хүчинтэй тул 401 биш —
// вэб 401 авбал зочны токеноо шинэчилж, сагсаа алддаг.
// Admin устгасан худалдан авагчийн хуучин токен хүчингүй.
module.exports.requireCustomer = async (req, res, next) => {
  const id = req.session?.customerId;
  if (id) {
    try {
      const { customers } = require("../models");
      const active = await customers.count({ where: { id, shop_id: req.shopId, status: "active" } });
      if (active) return next();
    } catch (error) {
      return next(error);
    }
  }
  return res.status(200).json({ success: false, message: "Утасны дугаараар нэвтэрнэ үү" });
};
