const router = require("express").Router();
const { findFile, variantName } = require("../helper/fileHelper");

// Нийтэд нээлттэй: /file/{нэр} — эх зураг, /file/thumbnail/{нэр} — 400px,
// /file/grid/{нэр} — 256px, /file/icon/{нэр} — 128px (лого). Хувилбар байхгүй бол дараагийнх нь, эцэст нь эх.
const send = (res, ...names) => {
  for (const name of names) {
    const file = findFile(name);
    if (file) return res.set("Cache-Control", "public, max-age=31536000, immutable").sendFile(file);
  }
  return res.status(404).send(null);
};

router.get("/thumbnail/:name", (req, res) => send(res, variantName("thumb", req.params.name), req.params.name));
router.get("/grid/:name", (req, res) =>
  send(res, variantName("grid", req.params.name), variantName("thumb", req.params.name), req.params.name),
);
router.get("/icon/:name", (req, res) =>
  send(res, variantName("icon", req.params.name), variantName("thumb", req.params.name), req.params.name),
);
router.get("/:name", (req, res) => send(res, req.params.name));

module.exports = router;
