const router = require("express").Router();
const { isAdmin } = require("../../middleware/auth");
const { byAndAt } = require("../../middleware/timeStamp");
const controller = require("./controller");

// Дэлгүүрийн борлуулалт, худалдагчтай хийсэн тооцоо. ADMIN бүх дэлгүүрийг; SHOPPER зөвхөн
// өөрийн дэлгүүрийг харна (controller-т ownStoreId-ээр шүүнэ). Тооцоо шилжүүлэх — зөвхөн ADMIN.
router.get("/", controller.list);
router.get("/:storeId", controller.show);
router.post("/:storeId/settle", isAdmin, byAndAt, controller.settle);

module.exports = router;
