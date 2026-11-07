const fs = require("fs");
const path = require("path");
const moment = require("moment");
const str = require("@supercharge/strings");
const sharp = require("sharp");

// Admin-аас хуулсан зургууд: public/uploads/<folder>/<нэр> (эх), thumb_<нэр> (жижиг).
// <folder> нь model-ийн нэр (products, stores, users, blogs ...) — public/uploads доторх folder-ууд.
// Фронт файлын нэрийг id болгон хадгалж, /file/<нэр>, /file/thumbnail/<нэр>-ээр харуулна
// (файлын нэр давтагдахгүй тул аль folder-т байгааг нь хайж олно).
const uploadsRoot = path.join(__dirname, "../public/uploads");
const DEFAULT_FOLDER = "products";
const THUMB_WIDTH = 400;

const folderPath = (folder = DEFAULT_FOLDER) => path.join(uploadsRoot, folder);
// public/uploads доторх folder-ууд (model бүрийнх). products-ыг эхэнд нь — хуучин зургууд тэнд.
const folders = () => {
  const dirs = fs.existsSync(uploadsRoot)
    ? fs.readdirSync(uploadsRoot, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
    : [];
  return [DEFAULT_FOLDER, ...dirs.filter((d) => d !== DEFAULT_FOLDER)];
};
const isFolder = (folder) => typeof folder === "string" && /^[A-Za-z]+$/.test(folder) && folders().includes(folder);

module.exports.uploadsRoot = uploadsRoot;
module.exports.folderPath = folderPath;
module.exports.isFolder = isFolder;
module.exports.thumbName = (fileName) => `thumb_${fileName}`;

// Файлын нэрээр аль folder-т байгааг хайна. Олдохгүй бол null
module.exports.findFile = (fileName) => {
  const name = path.basename(fileName);
  for (const folder of folders()) {
    const file = path.join(uploadsRoot, folder, name);
    if (fs.existsSync(file)) return file;
  }
  return null;
};

const isImage = (file) => /^image\/(jpeg|png|webp|gif|svg\+xml)$/.test(file.mimetype);
module.exports.isImage = isImage;

// file - formidable-ийн файл объект, folder - public/uploads доторх folder. Буцаах: хадгалсан файлын нэр
module.exports.saveImage = async (file, folder = DEFAULT_FOLDER) => {
  const uploadPath = folderPath(folder);
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
