const router = require("express").Router();
const { body } = require("express-validator");
const { protect } = require("../../middleware/auth");
const { validate } = require("../../utils/validationHelper");
const { isPhone } = require("../../helper/helper");
const { login, getUserData, updateMe } = require("./controller");

router.post(
  "/login",
  validate([
    body("phone").custom((v) => isPhone(v)).withMessage("Утасны дугаар 8 оронтой байна"),
    body("password").notEmpty().withMessage("Нууц үг оруулна уу"),
  ]),
  login,
);
router.get("/getUserData", protect, getUserData);
// Нэвтэрсэн админ өөрийн мэдээллээ засна; newPassword өгвөл password (одоогийн нууц үг) шаардана
router.put(
  "/me",
  protect,
  validate([
    body("name").trim().notEmpty().withMessage("Нэр оруулна уу"),
    body("phone").custom((v) => isPhone(v)).withMessage("Утасны дугаар 8 оронтой байна"),
    body("email").optional({ checkFalsy: true }).trim().isEmail().withMessage("Имэйл буруу байна"),
    body("newPassword").optional({ checkFalsy: true }).isLength({ min: 6 }).withMessage("Нууц үг 6-аас дээш тэмдэгттэй байна"),
  ]),
  updateMe,
);

module.exports = router;
