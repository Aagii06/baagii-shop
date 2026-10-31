const path = require("path");
const fs = require("fs");
const formidable = require("formidable");
const router = require("express").Router();
const { saveImage, isImage } = require("../../helper/fileHelper");
const { ok, fail, handle } = require("../../helper/helper");

// Барааны зураг хуулах: multipart, талбар нь "file". Буцаах: { id } — зургийн id (файлын нэр)
router.post(
  "/upload",
  handle("upload", async (req, res) => {
    const form = formidable({ maxFileSize: 20 * 1024 * 1024, keepExtensions: true, uploadDir: path.join(__dirname, "../../tmpFile") });
    const { files } = await new Promise((resolve, reject) =>
      form.parse(req, (error, fields, files) => (error ? reject(error) : resolve({ fields, files }))),
    );
    let file = files.file;
    if (Array.isArray(file)) file = file[0];
    if (!file) return fail(res, "Зураг сонгоно уу");
    if (!isImage(file)) {
      await fs.promises.rm(file.filepath, { force: true });
      return fail(res, "PNG, JPG, WEBP, GIF эсвэл SVG зураг сонгоно уу");
    }
    return ok(res, { id: await saveImage(file) });
  }),
);

module.exports = router;
