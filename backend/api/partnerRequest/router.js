const router = require("express").Router();
const { isAdmin } = require("../../middleware/auth");
const { byAndAt } = require("../../middleware/timeStamp");
const controller = require("./controller");

router.use(isAdmin);
router.route("/").get(controller.list).post(byAndAt, controller.create);
router.post("/:id/approve", byAndAt, controller.approve);
router.post("/:id/reject", byAndAt, controller.reject);

module.exports = router;
