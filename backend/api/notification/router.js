const router = require("express").Router();
const controller = require("./controller");

// ADMIN ба SHOPPER хоёулаа — тус бүр өөрийн мэдэгдлийг л харна
router.get("/", controller.list);
router.get("/unread", controller.unread);
router.post("/readAll", controller.markAllRead);
router.post("/:id/read", controller.markRead);

module.exports = router;
