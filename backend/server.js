const express = require("express");
require("./config/env");
const moment = require("moment");
const cors = require("cors");
const { resolveShop } = require("./middleware/shop");

// public/uploads/<model> folder-ууд (зураг хадгалах) байхгүй бол үүсгэнэ
require("./helper/fileHelper").ensureFolders();

const app = express();
const PORT = process.env.PORT || 5021;

// Вэб/админ хуудас сунгасан токеныг уншихын тулд толгойг ил гаргана.
app.use(cors({ exposedHeaders: ["X-Refresh-Token"] }));
app.use(express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));
app.use(express.json({ limit: "50mb" }));

// API-ийн тайлбар (docs/openapi.js) — X-Shop-Id шаардахгүй тул resolveShop-оос өмнө
const swaggerUi = require("swagger-ui-express");
app.use("/api/doc", swaggerUi.serve, swaggerUi.setup(require("./docs/openapi"), { customSiteTitle: "UVS shop API" }));
// Android утсан дээрх SMS gateway app (OTP SMS илгээнэ) — X-Shop-Id-гүй, SMS_GATEWAY_TOKEN-оор
app.use("/api/sms-gateway", require("./api/smsGateway/router"));
// Admin самбар (../admin) ба дэлгүүр (../web) — аль дэлгүүрийнх нь X-Shop-Id толгойгоор
app.use("/api", resolveShop, require("./api/routes"));
// QPay-ийн callback нь X-Shop-Id илгээдэггүй тул дэлгүүр шүүхээс өмнө
app.all("/web/qpay/callback/:no", require("./web/payment/callback"));
app.use("/web", resolveShop, require("./web/routes"));
// Барааны зураг
app.use("/file", require("./file/router"));

// Android app татах: /download/uvsshop.apk (эсвэл /download/app).
// APK-г сервер дээр backend/public/app/uvsshop.apk руу гараар хуулна (git-д ордоггүй).
const path = require("path");
const APK_FILE = path.join(__dirname, "public", "app", "uvsshop.apk");
app.get(["/download/app", "/download/uvsshop.apk"], (req, res) => {
  res.set("Cache-Control", "no-cache");
  res.type("application/vnd.android.package-archive");
  res.download(APK_FILE, "uvsshop.apk", (err) => {
    if (err && !res.headersSent) res.status(404).send("APK олдсонгүй");
  });
});

app.get("/", (req, res) => res.send("UVS shop backend"));

app.listen(PORT, () => {
  console.log("UVS shop backend start:", moment().format("YYYY-MM-DD HH:mm:ss"), "port", PORT);
});

// Удаан төлөгдөөгүй захиалгыг админд сануулна (helper/notificationHelper.js)
const { scanOverdueOrders } = require("./helper/notificationHelper");
setTimeout(scanOverdueOrders, 60 * 1000);
setInterval(scanOverdueOrders, 10 * 60 * 1000);
// unpaidCancelHours (3 цаг) төлөгдөөгүй захиалгыг автоматаар цуцалж, бараа үлдэгдэлд буцаана
const { autoCancelUnpaidOrders } = require("./helper/orderAutoCancel");
setTimeout(autoCancelUnpaidOrders, 45 * 1000);
setInterval(autoCancelUnpaidOrders, 5 * 60 * 1000);
// Даваа гараг бүр админд долоо хоногийн тооцооны сануулга (helper/settlementReminder.js)
const { scanWeeklySettlement } = require("./helper/settlementReminder");
setTimeout(scanWeeklySettlement, 90 * 1000);
setInterval(scanWeeklySettlement, 10 * 60 * 1000);
