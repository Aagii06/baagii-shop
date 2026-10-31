const router = require("express").Router();
const { body } = require("express-validator");
const { protect } = require("../../middleware/auth");
const { validate } = require("../../utils/validationHelper");
const { login, getUserData } = require("./controller");

router.post(
  "/login",
  validate([
    body("userName").trim().notEmpty().withMessage("Нэвтрэх нэр оруулна уу"),
    body("password").notEmpty().withMessage("Нууц үг оруулна уу"),
  ]),
  login,
);
router.get("/getUserData", protect, getUserData);

module.exports = router;
