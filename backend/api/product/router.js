const router = require("express").Router();
const { list } = require("../../middleware/base");
const { byAndAt } = require("../../middleware/timeStamp");
const controller = require("./controller");

router.route("/").get(list, controller.list).post(byAndAt, controller.create);
router.route("/:id").get(controller.show).put(byAndAt, controller.update).delete(byAndAt, controller.destroy);

module.exports = router;
