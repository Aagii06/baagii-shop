const router = require("express").Router();
const { body } = require("express-validator");
const { protect } = require("../../middleware/auth");
const { validate } = require("../../utils/validationHelper");
const { isPhone } = require("../../helper/helper");
const { login, getUserData } = require("./controller");

router.post(
  "/login",
  validate([
    body("phone").custom((v) => isPhone(v)).withMessage("Утасны дугаар 8 оронтой байна"),
    body("password").notEmpty().withMessage("Нууц үг оруулна уу"),
  ]),
  login,
);
router.get("/getUserData", protect, getUserData);

module.exports = router;
