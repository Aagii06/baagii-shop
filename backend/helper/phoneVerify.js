const { roles, phoneVerifyDays } = require("../config/constants");
const { now, parseAt, toIso, FORMAT } = require("./helper");

// Админ самбарын хэрэглэгч (users) утасны дугаараа SMS кодоор баталгаажуулах ёстой.
// phone_verify_deadline өнгөрөөд phone_verified_at хоосон хэвээр бол хаагдана (ADMIN-аас бусад).

// at (эсвэл одоо)-оос phoneVerifyDays хоногийн дараах огноо
module.exports.verifyDeadlineFrom = (at = now()) => parseAt(at).add(phoneVerifyDays, "days").format(FORMAT);

const isPhoneBlocked = (user) =>
  user.role !== roles.admin && !user.phone_verified_at && Boolean(user.phone_verify_deadline) && now() > user.phone_verify_deadline;
module.exports.isPhoneBlocked = isPhoneBlocked;

module.exports.PHONE_BLOCKED_MESSAGE = "Утасны дугаараа хугацаанд нь баталгаажуулаагүй тул таны эрх хаагдсан байна. Админд хандана уу";

// Фронтод: { phoneVerified, phoneVerifyDeadline (ISO; ADMIN-д null — хаагдахгүй), phoneBlocked }
module.exports.phoneVerifyFields = (user) => ({
  phoneVerified: Boolean(user.phone_verified_at),
  phoneVerifyDeadline: user.phone_verified_at || user.role === roles.admin ? null : toIso(user.phone_verify_deadline),
  phoneBlocked: isPhoneBlocked(user),
});
