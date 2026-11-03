const router = require("express").Router();
const { body } = require("express-validator");
const { isAdmin } = require("../../middleware/auth");
const { byAndAt } = require("../../middleware/timeStamp");
const { validate } = require("../../utils/validationHelper");
const { isPhone } = require("../../helper/helper");
const controller = require("./controller");

const saveValidation = validate([
  body("name").trim().notEmpty().withMessage("Дэлгүүрийн нэр оруулна уу"),
  body("phone").custom((v) => isPhone(v)).withMessage("Утасны дугаар 8 оронтой байна"),
  body("email").optional({ checkFalsy: true }).trim().isEmail().withMessage("Имэйл буруу байна"),
]);

// Жагсаалт / дэлгэрэнгүйг SHOPPER өөрийнхөөрөө харна; бүртгэх, засах, устгах нь зөвхөн ADMIN
router.route("/").get(controller.list).post(isAdmin, saveValidation, byAndAt, controller.create);
router
  .route("/:id")
  .get(controller.show)
  .put(isAdmin, saveValidation, byAndAt, controller.update)
  .delete(isAdmin, byAndAt, controller.destroy);

module.exports = router;
