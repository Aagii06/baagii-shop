const router = require("express").Router();
const { body } = require("express-validator");
const { list } = require("../../middleware/base");
const { byAndAt } = require("../../middleware/timeStamp");
const { validate } = require("../../utils/validationHelper");
const controller = require("./controller");

const saveValidation = validate([body("name").trim().notEmpty().withMessage("Нэр оруулна уу")]);

router.route("/").get(list, controller.list).post(saveValidation, byAndAt, controller.create);
router.route("/:id").get(controller.show).put(saveValidation, byAndAt, controller.update).delete(byAndAt, controller.destroy);

module.exports = router;
