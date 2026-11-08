const path = require("path");
const fs = require("fs");
const formidable = require("formidable");
const router = require("express").Router();
const { saveImage, isImage, isFolder, MAX_UPLOAD_BYTES, TOO_LARGE_MESSAGE, isTooLarge } = require("../../helper/fileHelper");
const { ok, fail, handle } = require("../../helper/helper");

// Зураг хуулах: multipart, талбар нь "file", "folder" — public/uploads доторх folder
// (products, stores, users ...; өгөхгүй бол products). Буцаах: { id } — зургийн id (файлын нэр)
router.post(
  "/upload",
  handle("upload", async (req, res) => {
    const form = formidable({ maxFileSize: MAX_UPLOAD_BYTES, keepExtensions: true, uploadDir: path.join(__dirname, "../../tmpFile") });
    let parsed;
    try {
      parsed = await new Promise((resolve, reject) =>
        form.parse(req, (error, fields, files) => (error ? reject(error) : resolve({ fields, files }))),
      );
    } catch (error) {
      if (isTooLarge(error)) return fail(res, TOO_LARGE_MESSAGE);
      throw error;
    }
    const { fields, files } = parsed;
    let file = files.file;
    if (Array.isArray(file)) file = file[0];
    if (!file) return fail(res, "Зураг сонгоно уу");
    if (!isImage(file)) {
      await fs.promises.rm(file.filepath, { force: true });
      return fail(res, "PNG, JPG, WEBP, GIF эсвэл SVG зураг сонгоно уу");
    }
    const folder = fields.folder || "products";
    if (!isFolder(folder)) {
      await fs.promises.rm(file.filepath, { force: true });
      return fail(res, "Зургийн folder буруу байна");
    }
    return ok(res, { id: await saveImage(file, folder) });
  }),
);

module.exports = router;
