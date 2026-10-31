const router = require("express").Router();
const { body } = require("express-validator");
const { list } = require("../../middleware/base");
const { byAndAt } = require("../../middleware/timeStamp");
const { validate } = require("../../utils/validationHelper");
const controller = require("./controller");

const saveValidation = validate([
  body("title").trim().notEmpty().withMessage("Гарчиг оруулна уу"),
  body("body").trim().notEmpty().withMessage("Нийтлэлийн текст оруулна уу"),
]);

router.route("/").get(list, controller.list).post(saveValidation, byAndAt, controller.create);
router.route("/:id").get(controller.show).put(saveValidation, byAndAt, controller.update).delete(byAndAt, controller.destroy);

module.exports = router;
