const router = require("express").Router();
const { body } = require("express-validator");
const { protectWeb, requireCustomer } = require("../../middleware/auth");
const { validate } = require("../../utils/validationHelper");
const { isPhone } = require("../../helper/helper");
const controller = require("./controller");

const phone = (field) => body(field).custom((v) => isPhone(v)).withMessage("Утасны дугаар 8 оронтой байна");

router.post("/loginGuest", controller.loginGuest);
router.get("/getUserData", protectWeb, controller.getUserData);
// Утас + SMS кодоор нэвтрэх. Зочны токеноор дуудвал зочны сагс худалдан авагчид шилжинэ.
router.post("/sendOtp", validate([phone("phone")]), controller.sendOtp);
router.post("/verifyOtp", protectWeb, validate([phone("phone"), body("code").trim().notEmpty().withMessage("Код оруулна уу")]), controller.verifyOtp);
router.put("/me", protectWeb, requireCustomer, validate([body("name").trim().notEmpty().withMessage("Нэр оруулна уу")]), controller.updateMe);
// Хамтран ажиллах хүсэлт (вэбийн /seller): утсаа OTP-оор баталгаажуулж, дэлгүүрийн мэдээллээ илгээнэ
router.post("/register/sendOtp", validate([phone("phone")]), controller.sendRegisterOtp);
router.post(
  "/register/verifyOtp",
  validate([phone("phone"), body("code").trim().notEmpty().withMessage("Код оруулна уу")]),
  controller.verifyRegisterOtp,
);
router.post(
  "/register",
  validate([
    phone("userName"),
    body("storeName").trim().notEmpty().withMessage("Дэлгүүрийн нэр оруулна уу"),
    body("name").trim().notEmpty().withMessage("Нэрээ оруулна уу"),
    body("email").optional({ checkFalsy: true }).trim().isEmail().withMessage("Имэйл буруу байна"),
  ]),
  controller.register,
);

module.exports = router;
