const router = require("express").Router();
const { body } = require("express-validator");
const { isAdmin } = require("../../middleware/auth");
const { byAndAt } = require("../../middleware/timeStamp");
const { validate } = require("../../utils/validationHelper");
const { isPhone } = require("../../helper/helper");
const controller = require("./controller");

const saveValidation = validate([
  body("name").trim().notEmpty().withMessage("Нэр оруулна уу"),
  body("phone").custom((v) => isPhone(v)).withMessage("Утасны дугаар 8 оронтой байна"),
  body("email").optional({ checkFalsy: true }).trim().isEmail().withMessage("Имэйл буруу байна"),
  body("role").isIn(["admin", "shopper"]).withMessage("Эрх сонгоно уу"),
]);

router.use(isAdmin);
router.route("/").get(controller.list).post(saveValidation, byAndAt, controller.create);
router.put("/:id/extendPhoneVerify", byAndAt, controller.extendPhoneVerify);
router.route("/:id").get(controller.show).put(saveValidation, byAndAt, controller.update).delete(byAndAt, controller.destroy);

module.exports = router;
