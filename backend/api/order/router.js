const router = require("express").Router();
const { byAndAt } = require("../../middleware/timeStamp");
const controller = require("./controller");

router.route("/").get(controller.list).post(byAndAt, controller.create);
// ?range=today|yesterday|week|month
router.get("/sales", controller.sales);
router.get("/:id", controller.show);
router.put("/:id/status", byAndAt, controller.setStatus);
router.post("/:id/return", byAndAt, controller.returnItem);

module.exports = router;
