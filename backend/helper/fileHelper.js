const fs = require("fs");
const path = require("path");
const moment = require("moment");
const str = require("@supercharge/strings");
const sharp = require("sharp");

// Admin-аас хуулсан зургууд: public/uploads/<folder>/<нэр> (main) ба icon_, thumb_, grid_ хувилбарууд.
// <folder> нь model-ийн нэр (products, stores, users, blogs ...) — public/uploads доторх folder-ууд.
// Фронт файлын нэрийг id болгон хадгалж, /file/<нэр>, /file/thumbnail/<нэр>-ээр харуулна
// (файлын нэр давтагдахгүй тул аль folder-т байгааг нь хайж олно).
const uploadsRoot = path.join(__dirname, "../public/uploads");
const DEFAULT_FOLDER = "products";

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

// Зураг бүр 4 файлтай (хуучин backend-ийн saveSharpConverter-ийн санаагаар), өргөнөөр нь жижигрүүлнэ:
//   icon_<нэр>  — 128px: admin-ы жагсаалт, захиалгын мөр, жижиг лого (≤64px)
//   thumb_<нэр> — 300px: сагс, хямдралын tile, дэлгүүрийн лого карт (≤150px)
//   grid_<нэр>  — 600px: барааны grid карт, admin-ы зургийн засвар
//   <нэр>       — main, 1600px: барааны дэлгэрэнгүйн зураг (эх зураг өөрөө хадгалагдахгүй)
// Retina дэлгэцэнд харагдах хэмжээнээс 2 дахин том. Жижиг зургийг томруулахгүй.
// JPG/PNG/WEBP-ээс бусдыг (svg, gif) жижигрүүлэхгүй — эхээр нь хадгалж, бүх хэмжээнд эх нь харагдана.
const VARIANTS = {
  icon: { prefix: "icon_", width: 128 },
  thumb: { prefix: "thumb_", width: 300 },
  grid: { prefix: "grid_", width: 600 },
};
const MAIN_WIDTH = 1600;
const RESIZABLE = /\.(jpe?g|png|webp)$/i;
const folderVariants = () => Object.keys(VARIANTS);
module.exports.VARIANTS = VARIANTS;
module.exports.MAIN_WIDTH = MAIN_WIDTH;
module.exports.folderVariants = folderVariants;
module.exports.variantName = (variant, fileName) => `${VARIANTS[variant].prefix}${fileName}`;

const resize = (source, width, target) =>
  sharp(source).rotate().resize({ width, withoutEnlargement: true }).toFile(target);

// folder доторх fileName-ийн дутуу хувилбаруудыг (icon_, thumb_, grid_) үүсгэнэ — байгааг нь алгасна.
// source — эх файл (өгөхгүй бол folder доторх main).
const makeVariants = async (folder, fileName, source) => {
  if (!RESIZABLE.test(fileName)) return;
  const dir = folderPath(folder);
  const from = source || path.join(dir, fileName);
  await Promise.all(
    folderVariants(folder).map(async (variant) => {
      const target = path.join(dir, module.exports.variantName(variant, fileName));
      if (fs.existsSync(target)) return;
      try {
        await resize(from, VARIANTS[variant].width, target);
      } catch (error) {
        // уншиж чадахгүй бол хувилбаргүй — харуулахдаа main руу буцна
      }
    }),
  );
};
module.exports.makeVariants = makeVariants;

// file - formidable-ийн файл объект, folder - public/uploads доторх folder. Буцаах: хадгалсан файлын нэр
module.exports.saveImage = async (file, folder = DEFAULT_FOLDER) => {
  const uploadPath = folderPath(folder);
  const ext = path.extname(file.originalFilename || file.newFilename).replace(".", "").toLowerCase() || "jpg";
  const fileName = `${moment().utcOffset("+0800").format("YYYYMMDDHHmmss")}_${str.random(12)}.${ext}`;
  const main = path.join(uploadPath, fileName);
  await fs.promises.mkdir(uploadPath, { recursive: true });
  try {
    if (!RESIZABLE.test(fileName)) throw new Error("not resizable");
    await resize(file.filepath, MAIN_WIDTH, main);
  } catch (error) {
    await fs.promises.copyFile(file.filepath, main);
  }
  await makeVariants(folder, fileName, file.filepath);
  // tmpFile дотор түр файл хуримтлагдахгүй
  await fs.promises.rm(file.filepath, { force: true });
  return fileName;
};
