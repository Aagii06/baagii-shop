const express = require("express");
require("./config/env");
const moment = require("moment");
const cors = require("cors");
const { resolveShop } = require("./middleware/shop");

const app = express();
const PORT = process.env.PORT || 5021;

app.use(cors());
app.use(express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));
app.use(express.json({ limit: "50mb" }));

// Admin самбар (../admin) ба дэлгүүр (../web) — аль дэлгүүрийнх нь X-Shop-Id толгойгоор
app.use("/api", resolveShop, require("./api/routes"));
app.use("/web", resolveShop, require("./web/routes"));
// Барааны зураг
app.use("/file", require("./file/router"));

app.get("/", (req, res) => res.send("UVS shop backend"));

app.listen(PORT, () => {
  console.log("UVS shop backend start:", moment().format("YYYY-MM-DD HH:mm:ss"), "port", PORT);
});
