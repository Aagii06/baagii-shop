const router = require("express").Router();
const { body } = require("express-validator");
const { isAdmin } = require("../../middleware/auth");
const { byAndAt } = require("../../middleware/timeStamp");
const { validate } = require("../../utils/validationHelper");
const { isPhone } = require("../../helper/helper");
const controller = require("./controller");

// Утас, имэйл, хаяг тус бүр дээд тал нь
const maxStoreContacts = 5;

const saveValidation = validate([
  body("name").trim().notEmpty().withMessage("Дэлгүүрийн нэр оруулна уу"),
  body("phones")
    .isArray({ min: 1, max: maxStoreContacts })
    .withMessage(`Утасны дугаар 1-${maxStoreContacts} байна`),
  body("phones.*").custom((v) => isPhone(v)).withMessage("Утасны дугаар 8 оронтой байна"),
  body("emails").optional().isArray({ max: maxStoreContacts }).withMessage(`Имэйл ${maxStoreContacts} хүртэл байна`),
  body("emails.*").trim().isEmail().withMessage("Имэйл буруу байна"),
  body("addresses").optional().isArray({ max: maxStoreContacts }).withMessage(`Хаяг ${maxStoreContacts} хүртэл байна`),
  body("addresses.*").trim().notEmpty().isLength({ max: 255 }).withMessage("Хаяг 255 тэмдэгтээс хэтрэхгүй"),
]);

// Жагсаалт / дэлгэрэнгүйг SHOPPER өөрийнхөөрөө харна; бүртгэх, засах, устгах нь зөвхөн ADMIN
router.route("/").get(controller.list).post(isAdmin, saveValidation, byAndAt, controller.create);
router
  .route("/:id")
  .get(controller.show)
  .put(isAdmin, saveValidation, byAndAt, controller.update)
  .delete(isAdmin, byAndAt, controller.destroy);

module.exports = router;
