const fs = require("fs");
const path = require("path");
const moment = require("moment");
const str = require("@supercharge/strings");
const sharp = require("sharp");

// Admin-аас хуулсан зургууд: public/uploads/<folder>/<нэр> (эх), thumb_<нэр> (жижиг).
// <folder> нь model-ийн нэр (products, stores, users, blogs ...) — public/uploads доторх folder-ууд.
// Фронт файлын нэрийг id болгон хадгалж, /file/<нэр>, /file/thumbnail/<нэр>-ээр харуулна
// (файлын нэр давтагдахгүй тул аль folder-т байгааг нь хайж олно).
// Бараа, лого (products, stores, users): эх, thumb_, icon_, grid_ гэсэн 4 файл; бусад: эх, thumb_.
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

// public/uploads/<model> folder-уудыг (models/*.js бүрт нэг) байхгүй бол үүсгэнэ — server асахад.
// Git-д folder бүр .gitignore-оор орсон ч deploy-оор ирэхгүй тохиолдолд хоосон folder-ууд бэлэн байна.
module.exports.ensureFolders = () => {
  const modelsDir = path.join(__dirname, "../models");
  const models = fs
    .readdirSync(modelsDir)
    .filter((file) => file.endsWith(".js") && file !== "index.js")
    .map((file) => path.basename(file, ".js"));
  for (const model of models) fs.mkdirSync(folderPath(model), { recursive: true });
};
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

// Жижиг хувилбарууд: <prefix><нэр>. Бүх folder-т thumb_, бараа ба лого (products, stores, users)-д icon_, grid_ нэмэлт.
//   thumb_ — 400px өргөн
//   icon_  — 128px-д багтаасан (≤64px: admin-ы жагсаалт, захиалгын мөр, жижиг лого)
//   grid_  — бараа: 600px-д багтаасан (барааны grid карт); лого: 256px (дэлгүүрийн карт, 56–96px)
const VARIANTS = {
  thumb: { prefix: "thumb_", resize: { width: THUMB_WIDTH } },
  grid: { prefix: "grid_", resize: { width: 256, height: 256, fit: "inside" } },
  icon: { prefix: "icon_", resize: { width: 128, height: 128, fit: "inside" } },
};
// Folder-оор өөр хэмжээ (VARIANTS-ийг дарна)
const FOLDER_RESIZE = { products: { grid: { width: 600, height: 600, fit: "inside" } } };
const FULL_VARIANTS = ["thumb", "icon", "grid"];
const folderVariants = (folder) => (["products", "stores", "users"].includes(folder) ? FULL_VARIANTS : ["thumb"]);
const variantResize = (folder, variant) => FOLDER_RESIZE[folder]?.[variant] || VARIANTS[variant].resize;
module.exports.VARIANTS = VARIANTS;
module.exports.folderVariants = folderVariants;
module.exports.variantName = (variant, fileName) => `${VARIANTS[variant].prefix}${fileName}`;

// folder доторх fileName-ээс тухайн folder-ийн жижиг хувилбаруудыг үүсгэнэ (байгааг нь дахин хийхгүй).
// sharp уншиж чадахгүй (svg г.м.) бол хувилбаргүй — харуулахдаа эх файл руу буцна.
const makeVariants = async (folder, fileName, source) => {
  const dir = folderPath(folder);
  for (const variant of folderVariants(folder)) {
    const target = path.join(dir, module.exports.variantName(variant, fileName));
    if (fs.existsSync(target)) continue;
    try {
      await sharp(source || path.join(dir, fileName))
        .rotate()
        .resize({ ...variantResize(folder, variant), withoutEnlargement: true })
        .toFile(target);
    } catch (error) {
      // эх файлаар харуулна
    }
  }
};
module.exports.makeVariants = makeVariants;

// file - formidable-ийн файл объект, folder - public/uploads доторх folder. Буцаах: хадгалсан файлын нэр
module.exports.saveImage = async (file, folder = DEFAULT_FOLDER) => {
  const uploadPath = folderPath(folder);
  const ext = path.extname(file.originalFilename || file.newFilename).replace(".", "").toLowerCase() || "jpg";
  const fileName = `${moment().utcOffset("+0800").format("YYYYMMDDHHmmss")}_${str.random(12)}.${ext}`;
  await fs.promises.mkdir(uploadPath, { recursive: true });
  await fs.promises.copyFile(file.filepath, path.join(uploadPath, fileName));
  await makeVariants(folder, fileName, file.filepath);
  await fs.promises.rm(file.filepath, { force: true });
  return fileName;
};
