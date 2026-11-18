const router = require("express").Router();
const controller = require("./controller").build({ ownerType: "user", ownerOf: (req) => req.loggedUser.id });

// ADMIN ба SHOPPER хоёулаа — тус бүр өөрийн мэдэгдлийг л харна
router.get("/", controller.list);
router.get("/unread", controller.unread);
router.post("/readAll", controller.markAllRead);
router.post("/device", controller.registerDevice);
router.post("/device/remove", controller.removeDevice);
router.post("/:id/read", controller.markRead);

module.exports = router;
