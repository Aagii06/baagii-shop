const express = require("express");
require("./config/env");
const moment = require("moment");
const cors = require("cors");
const { resolveShop } = require("./middleware/shop");

// public/uploads/<model> folder-ууд (зураг хадгалах) байхгүй бол үүсгэнэ
require("./helper/fileHelper").ensureFolders();

const app = express();
const PORT = process.env.PORT || 5021;

app.use(cors());
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

app.get("/", (req, res) => res.send("UVS shop backend"));

app.listen(PORT, () => {
  console.log("UVS shop backend start:", moment().format("YYYY-MM-DD HH:mm:ss"), "port", PORT);
});
