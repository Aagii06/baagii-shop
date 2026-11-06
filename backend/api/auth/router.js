const router = require("express").Router();
const { body } = require("express-validator");
const { protect } = require("../../middleware/auth");
const { validate } = require("../../utils/validationHelper");
const { isPhone } = require("../../helper/helper");
const { login, getUserData, sendPhoneOtp, updateMe, sendPasswordOtp, changePassword, sendEmailOtp, changeEmail } = require("./controller");

router.post(
  "/login",
  validate([
    body("phone").custom((v) => isPhone(v)).withMessage("Утасны дугаар 8 оронтой байна"),
    body("password").notEmpty().withMessage("Нууц үг оруулна уу"),
  ]),
  login,
);
router.get("/getUserData", protect, getUserData);
// Утас солихын өмнө шинэ дугаар руу код илгээнэ
router.post("/me/sendOtp", protect, validate([body("phone").custom((v) => isPhone(v)).withMessage("Утасны дугаар 8 оронтой байна")]), sendPhoneOtp);
// Нэвтэрсэн админ өөрийн мэдээллээ засна; утас солибол code шаардана
router.put(
  "/me",
  protect,
  validate([
    body("name").trim().notEmpty().withMessage("Нэр оруулна уу"),
    body("phone").custom((v) => isPhone(v)).withMessage("Утасны дугаар 8 оронтой байна"),
    body("email").optional({ checkFalsy: true }).trim().isEmail().withMessage("Имэйл буруу байна"),
    body("logo").optional({ nullable: true }).isString().withMessage("Лого буруу байна"),
  ]),
  updateMe,
);
// Нууц үг солих: одоогийн password, шинэ newPassword (6+ тэмдэгт), түүнтэй ижил confirmPassword шалгаад бүртгэлтэй имэйл рүү код
// илгээнэ (/me/password/sendOtp), тэр кодоор солино (/me/password)
const passwordRules = [
  body("password").notEmpty().withMessage("Одоогийн нууц үгээ оруулна уу"),
  body("newPassword").isLength({ min: 6 }).withMessage("Нууц үг 6-аас дээш тэмдэгттэй байна"),
  body("confirmPassword")
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage("Шинэ нууц үг таарахгүй байна"),
];
router.post("/me/password/sendOtp", protect, validate(passwordRules), sendPasswordOtp);
router.put("/me/password", protect, validate([...passwordRules, body("code").trim().notEmpty().withMessage("Код оруулна уу")]), changePassword);
// Имэйл солихын өмнө шинэ имэйл рүү код илгээж, кодоор нь солино
const isEmail = body("email").trim().isEmail().withMessage("Имэйл буруу байна");
router.post("/me/email/sendOtp", protect, validate([isEmail]), sendEmailOtp);
router.put("/me/email", protect, validate([isEmail, body("code").trim().notEmpty().withMessage("Код оруулна уу")]), changeEmail);

module.exports = router;
