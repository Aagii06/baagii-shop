const crypto = require("crypto");
const moment = require("moment");

// Хэрэглэгчид харагдах захиалгын дугаар: <PREFIX>-<YYMMDD>-<6 тэмдэгт>, ж: UVS-261124-K7M3QX.
// orders.id нь дотоод PK хэвээр (админ URL, FK); вэб/апп-д зөвхөн энэ дугаар харагдана —
// дарааллаар нь тоо ширхэг тооцох, бусдын захиалгыг таах боломжгүй.
// 0/O, 1/I/L зэрэг андуурагдах тэмдэгтийг хассан (31 тэмдэгт → өдөрт 31^6 ≈ 887 сая хувилбар).
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const PREFIX = { 1: "UVS", 2: "AJR" };

const randomCode = (length = 6) => Array.from({ length }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join("");

/** at - "YYYY-MM-DD HH:mm:ss" (Улаанбаатарын цаг); өгөөгүй бол одоо */
module.exports.makeOrderNumber = (shopId, at) => {
  const day = (at ? moment(at, "YYYY-MM-DD HH:mm:ss") : moment().utcOffset("+0800")).format("YYMMDD");
  return `${PREFIX[shopId] ?? "ORD"}-${day}-${randomCode()}`;
};

// Вэбийн URL-д ирсэн утга: захиалгын дугаар (эсвэл хуучин мэдэгдлийн холбоосын тоон id)
module.exports.orderKey = (value) => {
  const v = String(value ?? "").trim().toUpperCase();
  return /^\d+$/.test(v) ? { id: Number(v) } : { order_number: v };
};
