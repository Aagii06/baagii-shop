const router = require("express").Router();
const { buildTree } = require("../../helper/categoryHelper");
const { ok, handle } = require("../../helper/helper");

router.get("/getCategoryTree", handle("categoryTree", async (req, res) => ok(res, await buildTree())));

module.exports = router;
