const fs = require("fs");
const path = require("path");
const router = require("express").Router();
const { uploadPath, thumbName } = require("../helper/fileHelper");

// Нийтэд нээлттэй: /file/{нэр} — эх зураг, /file/thumbnail/{нэр} — жижиг (байхгүй бол эх)
const send = (res, ...names) => {
  for (const name of names) {
    const file = path.join(uploadPath, path.basename(name));
    if (fs.existsSync(file)) return res.set("Cache-Control", "public, max-age=31536000, immutable").sendFile(file);
  }
  return res.status(404).send(null);
};

router.get("/thumbnail/:name", (req, res) => send(res, thumbName(req.params.name), req.params.name));
router.get("/:name", (req, res) => send(res, req.params.name));

module.exports = router;
