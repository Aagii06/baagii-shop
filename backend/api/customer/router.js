const router = require("express").Router();
const { isAdmin } = require("../../middleware/auth");
const { byAndAt } = require("../../middleware/timeStamp");
const controller = require("./controller");

router.use(isAdmin);
router.get("/", controller.list);
// { password } — устгахын өмнө admin өөрийн нууц үгээ дахин оруулна
router.delete("/:id", byAndAt, controller.destroy);

module.exports = router;
