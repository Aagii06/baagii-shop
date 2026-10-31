const moment = require("moment");

const FORMAT = "YYYY-MM-DD HH:mm:ss";

// Бүх огноог Улаанбаатарын цагаар (+08:00) мөр хэлбэрээр хадгална
module.exports.FORMAT = FORMAT;
module.exports.now = () => moment().utcOffset("+0800").format(FORMAT);
module.exports.today = () => moment().utcOffset("+0800").format("YYYY-MM-DD");
module.exports.parseAt = (value) => moment(value, FORMAT).utcOffset("+0800", true);

// Хадгалсан огноог фронтод ISO (2026-10-31T14:20:00+08:00) болгож өгнө
module.exports.toIso = (value) => (value ? moment(value, FORMAT).utcOffset("+0800", true).format() : null);

// DECIMAL багана mysql2-оос мөр ирнэ ("68000.00") — тоо болгоно
module.exports.toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

// Монгол дугаарын 8 оронг авна: "+976 9911-2345" → "99112345"
module.exports.phoneDigits = (value) => String(value ?? "").replace(/\D/g, "").replace(/^976(?=\d{8}$)/, "");

module.exports.isPhone = (value) => /^\d{8}$/.test(module.exports.phoneDigits(value));

// Бүх хариу { success, message, data } хэлбэртэй, HTTP 200
module.exports.ok = (res, data = null, message = "Амжилттай") => res.status(200).json({ success: true, message, data });
module.exports.fail = (res, message = "Алдаа", data = null) => res.status(200).json({ success: false, message, data });

// Controller-ийн алдааг нэг газар барина: string шидвэл тэр нь хэрэглэгчид харагдах мессеж
module.exports.handle = (name, fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (typeof error === "string") return module.exports.fail(res, error);
    console.log(`${name}Error:`, error);
    return module.exports.fail(res, "Алдаа гарлаа");
  }
};
