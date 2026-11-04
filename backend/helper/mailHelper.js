const nodemailer = require("nodemailer");
const { shops } = require("../models");

// Имэйл илгээх (BaagiiCar/backend-ийн mailHelper-тэй ижил): Gmail SMTP, App password-оор.
// .env: MAIL_USER_NAME, MAIL_USER_PASS. Хоосон бол илгээхгүй, консолд хэвлэнэ.

// local хэсэг: 1-64 тэмдэгт, цэгээр эхлэх/төгсөх болон ".." хориотой
// домэйн: label бүр 1-63 тэмдэгт, "-"-ээр эхлэх/төгсөхгүй, TLD үсгээр эхэлнэ
const emailRegex =
  /^(?!\.)(?!.*\.\.)[A-Za-z0-9!#$%&'*+\/=?^_`{|}~.-]{1,64}(?<!\.)@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z][A-Za-z0-9-]{0,61}[A-Za-z0-9]$/;

const isValidEmail = (email) => typeof email === "string" && email.length <= 254 && emailRegex.test(email);

module.exports.isValidEmail = isValidEmail;

// Холболтыг нэг удаа үүсгээд дахин ашиглана (имэйл бүрт TLS + нэвтрэлт хийхгүй)
let transporter = null;
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      pool: true,
      maxConnections: 3,
      tls: { rejectUnauthorized: true, minVersion: "TLSv1.2" },
      auth: { user: process.env.MAIL_USER_NAME, pass: process.env.MAIL_USER_PASS },
    });
  }
  return transporter;
};

// Илгээгчийн нэр нь дэлгүүрийн нэр (shops.name) — нэг backend хоёр дэлгүүрт үйлчилнэ
const senderName = async (shopId) => {
  const shop = shopId ? await shops.findOne({ where: { id: shopId }, attributes: ["name"], raw: true }) : null;
  return (shop?.name ?? "Shop").replace(/["<>]/g, "");
};

// data: { subject, html, text? }. Илгээвэл true, хаяг буруу/тохиргоогүй/алдаа бол false — дуудагчийг унагаахгүй
module.exports.sendMail = async (shopId, to, data) => {
  if (!isValidEmail(to)) return false;
  if (!process.env.MAIL_USER_NAME || !process.env.MAIL_USER_PASS) {
    console.log("sendMail (MAIL_USER_* тохируулаагүй):", to, data.subject);
    return false;
  }
  try {
    await getTransporter().sendMail({ from: `"${await senderName(shopId)}" <${process.env.MAIL_USER_NAME}>`, to, ...data });
    return true;
  } catch (error) {
    console.log("sendMailError:", to, error?.message ?? error);
    return false;
  }
};
