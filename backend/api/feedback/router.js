const router = require("express").Router();
const { isAdmin } = require("../../middleware/auth");
const { byAndAt } = require("../../middleware/timeStamp");
const controller = require("./controller");

router.use(isAdmin);
router.get("/", controller.list);
router.post("/:id/read", byAndAt, controller.markRead);
router.post("/:id/unread", byAndAt, controller.markUnread);
router.delete("/:id", controller.remove);

module.exports = router;
