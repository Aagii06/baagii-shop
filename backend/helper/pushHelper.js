const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const { deviceTokens, op } = require("../models");

// Апп руу push мэдэгдэл (Firebase Cloud Messaging HTTP v1). FIREBASE_SERVICE_ACCOUNT —
// service account JSON файлын зам (backend/-аас) эсвэл JSON өөрөө. Тохируулаагүй бол юу ч илгээхгүй.
// Push хэзээ ч үндсэн үйлдлийг унагаахгүй — алдааг зөвхөн log-д бичнэ.

let account;
const loadAccount = () => {
  if (account !== undefined) return account;
  account = null;
  const raw = (process.env.FIREBASE_SERVICE_ACCOUNT || "").trim();
  if (!raw) return account;
  try {
    const json = raw.startsWith("{") ? raw : fs.readFileSync(path.resolve(__dirname, "..", raw), "utf8");
    const parsed = JSON.parse(json);
    if (parsed.project_id && parsed.client_email && parsed.private_key) account = parsed;
    else console.error("FIREBASE_SERVICE_ACCOUNT: project_id/client_email/private_key алга");
  } catch (error) {
    console.error("FIREBASE_SERVICE_ACCOUNT уншиж чадсангүй:", error.message);
  }
  return account;
};

module.exports.pushEnabled = () => loadAccount() != null;

// Google OAuth access token (1 цаг хүчинтэй) — дуусахаас өмнө шинэчилнэ
let cached = { token: null, expires: 0 };
const accessToken = async (acc) => {
  if (cached.token && Date.now() < cached.expires - 60_000) return cached.token;
  const tokenUri = acc.token_uri || "https://oauth2.googleapis.com/token";
  const assertion = jwt.sign({ scope: "https://www.googleapis.com/auth/firebase.messaging" }, acc.private_key, {
    algorithm: "RS256",
    issuer: acc.client_email,
    audience: tokenUri,
    expiresIn: 3600,
  });
  const res = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) throw new Error(`FCM token: ${res.status} ${JSON.stringify(data)}`);
  cached = { token: data.access_token, expires: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return cached.token;
};

// Хүчингүй болсон (апп устгасан г.м.) токен — дахин илгээхгүйн тулд устгана
const isDeadToken = (status, data) => {
  const code = data?.error?.details?.find((d) => d.errorCode)?.errorCode ?? data?.error?.status;
  return status === 404 || code === "UNREGISTERED" || (status === 400 && code === "INVALID_ARGUMENT");
};

const sendOne = async (acc, row, { title, body, data }) => {
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${acc.project_id}/messages:send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await accessToken(acc)}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        token: row.token,
        notification: { title, ...(body ? { body } : {}) },
        data,
        android: { priority: "high", notification: { channel_id: "default", sound: "default" } },
        apns: { payload: { aps: { sound: "default" } } },
      },
    }),
  });
  if (res.ok) return;
  const result = await res.json().catch(() => null);
  if (isDeadToken(res.status, result)) await deviceTokens.destroy({ where: { id: row.id } });
  else console.error("FCM send failed:", res.status, JSON.stringify(result));
};

/**
 * ownerType: "user" (апп-ын админ хэсэг) | "customer" (апп-ын дэлгүүр хэсэг).
 * data.link — дарахад нээх зам, data.scope — "admin" | "shop".
 */
module.exports.sendPush = async ({ shopId, ownerType, ownerIds, title, body = null, type, link = null }) => {
  try {
    const acc = loadAccount();
    if (!acc || ownerIds.length === 0) return;
    const rows = await deviceTokens.findAll({
      where: { shop_id: shopId, owner_type: ownerType, owner_id: { [op.in]: ownerIds } },
      raw: true,
    });
    const data = { type: String(type ?? ""), link: String(link ?? ""), scope: ownerType === "user" ? "admin" : "shop" };
    await Promise.all(rows.map((row) => sendOne(acc, row, { title, body, data }).catch((e) => console.error("FCM:", e.message))));
  } catch (error) {
    console.error("sendPush failed:", error);
  }
};
