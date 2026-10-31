const express = require("express");
require("./config/env");
const moment = require("moment");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5021;

app.use(cors());
app.use(express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));
app.use(express.json({ limit: "50mb" }));

// Admin самбар (../admin)
app.use("/api", require("./api/routes"));
// Дэлгүүр (../web)
app.use("/web", require("./web/routes"));
// Барааны зураг
app.use("/file", require("./file/router"));

app.get("/", (req, res) => res.send("UVS shop backend"));

app.listen(PORT, () => {
  console.log("UVS shop backend start:", moment().format("YYYY-MM-DD HH:mm:ss"), "port", PORT);
});
