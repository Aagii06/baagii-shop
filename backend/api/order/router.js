const router = require("express").Router();
const { isAdmin } = require("../../middleware/auth");
const { byAndAt } = require("../../middleware/timeStamp");
const controller = require("./controller");

router.route("/").get(controller.list).post(byAndAt, controller.create);
// ?range=today|yesterday|week|month
router.get("/sales", controller.sales);
router.get("/:id", controller.show);
router.put("/:id/status", byAndAt, controller.setStatus);
router.post("/:id/return", byAndAt, controller.returnItem);
router.post("/:id/cancel", isAdmin, byAndAt, controller.cancel);

module.exports = router;
