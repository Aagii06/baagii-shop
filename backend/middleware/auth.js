const jwt = require("jsonwebtoken");
const { roles } = require("../config/constants");

const sign = (payload, expiresIn) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

// Токен бүр нэг дэлгүүрийнх (shopId): өөр дэлгүүрийн X-Shop-Id-тай ирвэл хүчингүй.

// Админ самбар (users хүснэгт)
module.exports.signUser = (user) => sign({ shopId: user.shop_id, user: { id: user.id, role: user.role } }, "7d");

// Вэб: зочин бүр guestId-тай (сагс үүгээр холбогдоно), утсаар нэвтэрсэн бол customerId нэмэгдэнэ
module.exports.signWeb = ({ shopId, guestId, customerId = null }) =>
  sign({ shopId, guestId, customerId }, customerId ? "30d" : "2d");

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

// Админ / борлуулагч. Вэбийн токен энд хүчингүй.
module.exports.protect = (req, res, next) => {
  const payload = readToken(req);
  if (!payload?.user) return unauthorized(res);
  req.loggedUser = payload.user;
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
  req.session = { guestId: payload.guestId, customerId: payload.customerId ?? null };
  next();
};

// protectWeb-ийн дараа: утсаар нэвтэрсэн байх ёстой. Зочны токен хүчинтэй тул 401 биш —
// вэб 401 авбал зочны токеноо шинэчилж, сагсаа алддаг.
module.exports.requireCustomer = (req, res, next) => {
  if (req.session?.customerId) return next();
  return res.status(200).json({ success: false, message: "Утасны дугаараар нэвтэрнэ үү" });
};
