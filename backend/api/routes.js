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
// Вэбийн "Бидэнд бичнэ үү" маягтаар ирсэн санал хүсэлт (ADMIN)
Router.use("/feedback", protect, require("./feedback/router"));
// Толгойн 🔔 мэдэгдэл (ADMIN, SHOPPER — өөрийнх нь)
Router.use("/notification", protect, require("./notification/router"));
Router.use("/blog", protect, require("./blog/router"));
Router.use("/store", protect, require("./store/router"));
Router.use("/user", protect, require("./user/router"));
// Вэбээр нэвтэрсэн худалдан авагчид (ADMIN, зөвхөн харах)
Router.use("/customer", protect, require("./customer/router"));
// Дансаар шилжүүлэх, QPay-ийн тохиргоо (ADMIN)
Router.use("/paymentSetting", protect, require("./paymentSetting/router"));
// Аймаг/Нийслэл → Сум/Дүүрэг → Баг/Хороо (дэлгүүрийн хаяг сонгоход) — вэбийнхтэй ижил
Router.use("/location", protect, require("../web/customerAddress/router"));

module.exports = Router;
