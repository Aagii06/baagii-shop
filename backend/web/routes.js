const { protectWeb, requireCustomer } = require("../middleware/auth");

const Router = require("express").Router();

// Каталог, хаягийн жагсаалт нээлттэй; сагс зочны токеноор, захиалга утсаар нэвтэрсэн байхад
Router.use("/auth", require("./auth/router"));
Router.use("/category", require("./category/router"));
Router.use("/post", require("./post/router"));
Router.use("/customerAddress", require("./customerAddress/router"));
Router.use("/cart", protectWeb, require("./cart/router"));
Router.use("/order", protectWeb, requireCustomer, require("./order/router"));

module.exports = Router;
