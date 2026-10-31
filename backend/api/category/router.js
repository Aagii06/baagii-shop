const router = require("express").Router();
const { body } = require("express-validator");
const { byAndAt } = require("../../middleware/timeStamp");
const { validate } = require("../../utils/validationHelper");
const controller = require("./controller");

const saveValidation = validate([body("name").trim().notEmpty().withMessage("Категорийн нэр оруулна уу")]);

router.get("/tree", controller.tree);
router.post("/", saveValidation, byAndAt, controller.create);
router.route("/:id").put(saveValidation, byAndAt, controller.update).delete(byAndAt, controller.destroy);

module.exports = router;
