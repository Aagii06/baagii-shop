const router = require("express").Router();
const { isAdmin } = require("../../middleware/auth");
const controller = require("./controller");

router.use(isAdmin);
router.get("/", controller.list);

module.exports = router;
