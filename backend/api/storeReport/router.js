const router = require("express").Router();
const { isAdmin } = require("../../middleware/auth");
const { byAndAt } = require("../../middleware/timeStamp");
const controller = require("./controller");

// Дэлгүүрийн борлуулалт, худалдагчтай хийсэн тооцоо — зөвхөн ADMIN
router.use(isAdmin);
router.get("/", controller.list);
router.get("/:storeId", controller.show);
router.post("/:storeId/settle", byAndAt, controller.settle);

module.exports = router;
