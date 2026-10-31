const { protect } = require("../middleware/auth");

const Router = require("express").Router();

// Нэвтрэх (login) нь токенгүй, бусад нь admin-ийн токен шаардана
Router.use("/auth", require("./auth/router"));
Router.use("/attr", protect, require("./attr/router"));
Router.use("/category", protect, require("./category/router"));
Router.use("/product", protect, require("./product/router"));
Router.use("/file", protect, require("./file/router"));
Router.use("/doNote", protect, require("./doNote/router"));
Router.use("/order", protect, require("./order/router"));
Router.use("/partnerRequest", protect, require("./partnerRequest/router"));

module.exports = Router;
