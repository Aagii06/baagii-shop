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

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Баталгаажуулах кодын имэйлийн загвар. Имэйл клиентүүдэд (Gmail, Outlook, утас) зөв харагдахаар
// table + inline style-аар бичсэн. { subject, html, text } буцаана.
const codeMailTemplate = ({ shopName, title, intro, code, minutes = 10 }) => {
  const shop = escapeHtml(shopName);
  const year = new Date().getFullYear();
  const html = `<!doctype html>
<html lang="mn">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(title)}: ${code}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
        <tr><td style="background:#111827;padding:24px 32px;text-align:center">
          <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.5px">${shop}</span>
        </td></tr>
        <tr><td style="padding:32px 32px 8px">
          <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#111827">${escapeHtml(title)}</h1>
          <p style="margin:0;font-size:15px;line-height:1.6;color:#4b5563">${escapeHtml(intro)}</p>
        </td></tr>
        <tr><td style="padding:24px 32px" align="center">
          <div style="display:inline-block;background:#f9fafb;border:1px dashed #d1d5db;border-radius:12px;padding:18px 28px">
            <span style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:34px;font-weight:700;letter-spacing:10px;color:#111827">${code}</span>
          </div>
          <p style="margin:14px 0 0;font-size:13px;color:#6b7280">Код <strong>${minutes} минут</strong> хүчинтэй.</p>
        </td></tr>
        <tr><td style="padding:8px 32px 32px">
          <div style="background:#fef3c7;border-radius:10px;padding:12px 16px;font-size:13px;line-height:1.5;color:#92400e">
            Энэ кодыг хэнд ч бүү хэл. Та энэ хүсэлтийг илгээгээгүй бол энэ имэйлийг үл тоомсорлоно уу.
          </div>
        </td></tr>
      </table>
      <p style="margin:20px 0 0;font-size:12px;color:#9ca3af">© ${year} ${shop}. Энэ имэйлийг автоматаар илгээсэн тул хариу бичих шаардлагагүй.</p>
    </td></tr>
  </table>
</body>
</html>`;
  const text = `${shopName}\n\n${title}\n${intro}\n\nКод: ${code}\nКод ${minutes} минут хүчинтэй.\n\nЭнэ кодыг хэнд ч бүү хэл. Та энэ хүсэлтийг илгээгээгүй бол үл тоомсорлоно уу.`;
  return { subject: `${code} — ${shopName} ${title.toLowerCase()}`, html, text };
};

module.exports.codeMailTemplate = codeMailTemplate;

// data: { subject, html, text? }. Илгээвэл true, хаяг буруу/тохиргоогүй/алдаа бол false — дуудагчийг унагаахгүй
const sendMail = async (shopId, to, data) => {
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

module.exports.sendMail = sendMail;

// Баталгаажуулах кодыг загвартай имэйлээр илгээнэ. { title, intro, code, minutes? }
module.exports.sendCodeMail = async (shopId, to, options) =>
  sendMail(shopId, to, codeMailTemplate({ shopName: await senderName(shopId), ...options }));
