const router = require("express").Router();
const controller = require("../../api/notification/controller").build({
  ownerType: "customer",
  ownerOf: (req) => req.session.customerId,
});

// Утсаар нэвтэрсэн худалдан авагчийн мэдэгдэл: захиалгын төлөв, хамтран ажиллах хүсэлтийн хариу
router.get("/", controller.list);
router.get("/unread", controller.unread);
router.post("/readAll", controller.markAllRead);
router.post("/device", controller.registerDevice);
router.post("/device/remove", controller.removeDevice);
router.post("/:id/read", controller.markRead);

module.exports = router;
