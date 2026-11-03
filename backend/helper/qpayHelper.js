const crypto = require("crypto");
const { paymentSettings, qpayInvoices, orders } = require("../models");
const { findOrder } = require("./orderHelper");
const { now, toNumber } = require("./helper");

// QPay merchant API v2. Тохиргоо нь дэлгүүр бүрийн paymentSettings-д (админ самбараас).
// Нэхэмжлэх үүсгээд QR/банкны холбоосыг вэбд өгнө; төлөгдсөнийг payment/check-ээр
// (вэбийн polling эсвэл QPay-ийн callback) шалгаж захиалгыг төлөгдсөн болгоно.
const baseUrl = (s) => (s.qpay_sandbox ? "https://merchant-sandbox.qpay.mn" : "https://merchant.qpay.mn");

// shop_id → { key, token, expiresAt }. Нэвтрэх мэдээлэл солигдвол key зөрж дахин авна
const tokens = new Map();

const qpayFetch = async (url, options) => {
  const res = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }
  if (!res.ok) {
    console.log("qpayError:", res.status, url, text);
    throw `QPay: ${data.message || data.error || res.status}`;
  }
  return data;
};

const getToken = async (s) => {
  const key = `${baseUrl(s)}|${s.qpay_username}|${s.qpay_password}`;
  const cached = tokens.get(s.shop_id);
  if (cached?.key === key && cached.expiresAt > Date.now() + 60 * 1000) return cached.token;
  const data = await qpayFetch(`${baseUrl(s)}/v2/auth/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${s.qpay_username}:${s.qpay_password}`).toString("base64")}` },
  });
  // expires_in нь unix секунд (заримдаа үлдсэн секунд) — аль нь ч байсан 50 минутаас хэтрүүлэхгүй
  const exp = Number(data.expires_in) || 0;
  const expiresAt = Math.min(exp > 1e9 ? exp * 1000 : Date.now() + exp * 1000, Date.now() + 50 * 60 * 1000);
  tokens.set(s.shop_id, { key, token: data.access_token, expiresAt });
  return data.access_token;
};

const authed = async (s, path, body) =>
  qpayFetch(`${baseUrl(s)}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await getToken(s)}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const qpayReady = (s) => Boolean(s?.qpay_enabled && s.qpay_username && s.qpay_password && s.qpay_invoice_code);
module.exports.qpayReady = qpayReady;

// Админ "Шалгах" дарахад: нэвтрэх мэдээлэл зөв эсэх
module.exports.testQpay = async (s) => {
  tokens.delete(s.shop_id);
  await getToken(s);
};

const orderTotal = (order) =>
  Math.max(
    0,
    order.items.reduce((sum, item) => sum + item.qty * toNumber(item.price), 0) + toNumber(order.delivery_fee) - toNumber(order.coupon_amount),
  );

const toWebInvoice = (invoice) => ({
  invoiceId: invoice.invoice_id,
  amount: toNumber(invoice.amount),
  qrText: invoice.qr_text,
  qrImage: invoice.qr_image,
  shortUrl: invoice.short_url,
  urls: invoice.urls ? JSON.parse(invoice.urls) : [],
  paid: invoice.status === "paid",
});
module.exports.toWebInvoice = toWebInvoice;

// Төлөгдөөгүй захиалгад нэхэмжлэх: дүн өөрчлөгдөөгүй бол хуучныг дахин ашиглана
module.exports.createInvoice = async (shopId, order) => {
  const s = await paymentSettings.findOne({ where: { shop_id: shopId } });
  if (!qpayReady(s)) throw "QPay-ээр төлөх боломжгүй байна";
  const amount = orderTotal(order);
  if (amount <= 0) throw "Төлөх дүн 0 байна";

  const existing = await qpayInvoices.findOne({ where: { shop_id: shopId, order_id: order.id, status: "pending" }, order: [["id", "desc"]] });
  if (existing && toNumber(existing.amount) === amount) return existing;

  const senderInvoiceNo = `${shopId}-${order.id}-${crypto.randomBytes(8).toString("hex")}`;
  const publicUrl = (process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5021}`).replace(/\/$/, "");
  const data = await authed(s, "/v2/invoice", {
    invoice_code: s.qpay_invoice_code,
    sender_invoice_no: senderInvoiceNo,
    invoice_receiver_code: order.phone || "terminal",
    invoice_description: `Захиалга #${order.id}`,
    amount,
    callback_url: `${publicUrl}/web/qpay/callback/${senderInvoiceNo}`,
  });
  const at = now();
  return qpayInvoices.create({
    shop_id: shopId,
    order_id: order.id,
    sender_invoice_no: senderInvoiceNo,
    invoice_id: data.invoice_id,
    amount,
    status: "pending",
    qr_text: data.qr_text,
    qr_image: data.qr_image,
    short_url: data.qPay_shortUrl,
    urls: JSON.stringify((data.urls ?? []).map(({ name, description, logo, link }) => ({ name, description, logo, link }))),
    created_at: at,
    updated_at: at,
  });
};

// QPay-ээс төлөгдсөн эсэхийг асууж, төлөгдсөн бол нэхэмжлэх, захиалгыг тэмдэглэнэ
const checkInvoice = async (invoice) => {
  if (invoice.status === "paid") return invoice;
  const s = await paymentSettings.findOne({ where: { shop_id: invoice.shop_id } });
  if (!qpayReady(s)) return invoice;
  const data = await authed(s, "/v2/payment/check", {
    object_type: "INVOICE",
    object_id: invoice.invoice_id,
    offset: { page_number: 1, page_limit: 100 },
  });
  const paid = (data.rows ?? []).filter((r) => r.payment_status === "PAID");
  const paidAmount = paid.reduce((sum, r) => sum + toNumber(r.payment_amount), 0);
  if (paid.length === 0 || paidAmount < toNumber(invoice.amount)) return invoice;

  const at = now();
  await invoice.update({ status: "paid", payment_id: String(paid[0].payment_id), paid_at: at, updated_at: at });
  await orders.update(
    { payment_method: "qpay", paid_at: at, updated_at: at },
    { where: { id: invoice.order_id, shop_id: invoice.shop_id, paid_at: null } },
  );
  return invoice;
};
module.exports.checkInvoice = checkInvoice;

// Захиалгын сүүлийн нэхэмжлэхийг шалгана (вэбийн polling)
module.exports.checkOrder = async (shopId, orderId) => {
  const invoice = await qpayInvoices.findOne({ where: { shop_id: shopId, order_id: orderId }, order: [["id", "desc"]] });
  if (invoice) await checkInvoice(invoice);
  return findOrder({ id: orderId, shop_id: shopId });
};
