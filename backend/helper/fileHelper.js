const fs = require("fs");
const path = require("path");
const moment = require("moment");
const str = require("@supercharge/strings");
const sharp = require("sharp");

// Admin-аас хуулсан зургууд: public/uploads/products/<нэр> (эх), thumb_<нэр> (жижиг).
// Фронт файлын нэрийг id болгон хадгалж, /file/<нэр>, /file/thumbnail/<нэр>-ээр харуулна.
const uploadPath = path.join(__dirname, "../public/uploads/products");
const THUMB_WIDTH = 400;

module.exports.uploadPath = uploadPath;
module.exports.thumbName = (fileName) => `thumb_${fileName}`;

const isImage = (file) => /^image\/(jpeg|png|webp|gif|svg\+xml)$/.test(file.mimetype);
module.exports.isImage = isImage;

// file - formidable-ийн файл объект. Буцаах: хадгалсан файлын нэр
module.exports.saveImage = async (file) => {
  const ext = path.extname(file.originalFilename || file.newFilename).replace(".", "").toLowerCase() || "jpg";
  const fileName = `${moment().utcOffset("+0800").format("YYYYMMDDHHmmss")}_${str.random(12)}.${ext}`;
  await fs.promises.mkdir(uploadPath, { recursive: true });
  await fs.promises.copyFile(file.filepath, path.join(uploadPath, fileName));
  try {
    await sharp(file.filepath)
      .rotate()
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .toFile(path.join(uploadPath, module.exports.thumbName(fileName)));
  } catch (error) {
    // sharp уншиж чадахгүй (svg г.м.) бол жижиг хувилбар нь эх файл өөрөө
  }
  await fs.promises.rm(file.filepath, { force: true });
  return fileName;
};
