const router = require("express").Router();
const { isAdmin } = require("../../middleware/auth");
const { byAndAt } = require("../../middleware/timeStamp");
const controller = require("./controller");

router.use(isAdmin);
router.get("/", controller.list);
router.post("/:id/approve", byAndAt, controller.approve);
router.post("/:id/reject", byAndAt, controller.reject);
router.post("/:id/revert", byAndAt, controller.revert);

module.exports = router;
