// Хуучин (өмнө нь бүртгэгдсэн) зургуудыг 4 төрөлтэй болгоно: main + icon_ + thumb_ + grid_
// (хэмжээ нь helper/fileHelper.js VARIANTS). public/uploads доторх бүх folder-т, эсвэл заасанд нь.
// Байгаа хувилбарыг алгасна, тиймээс дахин ажиллуулахад аюулгүй.
//   node scripts/makeVariants.js                    — дутуу хувилбаруудыг үүсгэнэ
//   node scripts/makeVariants.js products           — зөвхөн заасан folder(ууд)
//   node scripts/makeVariants.js --force            — хувилбаруудыг устгаад шинэ хэмжээгээр дахин үүсгэнэ
//   node scripts/makeVariants.js --main             — 1600px-ээс том main зургийг 1600px болгож багасгана
//                                                     (эх зураг солигдоно — буцаах боломжгүй)
// Жишээ нь хуучин бараануудыг бүрэн шинэчлэх: node scripts/makeVariants.js products --force --main
// Зургууд сервер дээр байдаг тул сервер дээр (backend/ дотроос) ажиллуулна.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { uploadsRoot, folderPath, folderVariants, makeVariants, variantName, VARIANTS, MAIN_WIDTH } = require("../helper/fileHelper");

const force = process.argv.includes("--force");
const shrinkMain = process.argv.includes("--main");
const only = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const prefixes = Object.values(VARIANTS).map((v) => v.prefix);
const RESIZABLE = /\.(jpe?g|png|webp)$/i;

// main-ийг MAIN_WIDTH болгож багасгана (түр файлд бичээд сольно). Багассан бол true
const resizeMain = async (file) => {
  const { width } = await sharp(file).metadata();
  if (!width || width <= MAIN_WIDTH) return false;
  const tmp = `${file}.tmp`;
  await sharp(file).rotate().resize({ width: MAIN_WIDTH }).toFile(tmp);
  await fs.promises.rename(tmp, file);
  return true;
};

(async () => {
  const dirs = fs.readdirSync(uploadsRoot, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  const total = { images: 0, made: 0, shrunk: 0, failed: 0 };
  for (const folder of dirs.filter((d) => only.length === 0 || only.includes(d))) {
    const dir = folderPath(folder);
    const names = fs.readdirSync(dir).filter((name) => RESIZABLE.test(name) && !prefixes.some((p) => name.startsWith(p)));
    const count = { made: 0, shrunk: 0, failed: 0 };
    for (const name of names) {
      try {
        const wanted = folderVariants(folder).map((variant) => path.join(dir, variantName(variant, name)));
        if (force) for (const file of wanted) fs.rmSync(file, { force: true });
        const missing = wanted.filter((file) => !fs.existsSync(file));
        // Хувилбаруудыг эх (том) зургаас нь эхэлж үүсгээд, дараа нь main-ийг багасгана
        if (missing.length) await makeVariants(folder, name);
        count.made += missing.filter((file) => fs.existsSync(file)).length;
        if (missing.some((file) => !fs.existsSync(file))) throw new Error("хувилбар үүссэнгүй");
        if (shrinkMain && (await resizeMain(path.join(dir, name)))) count.shrunk++;
      } catch (error) {
        count.failed++;
        console.log(`  алгасав: ${folder}/${name} — ${error.message}`);
      }
    }
    if (names.length)
      console.log(`${folder}: ${names.length} зураг, ${count.made} хувилбар үүсгэв${shrinkMain ? `, ${count.shrunk} main багасгав` : ""}`);
    total.images += names.length;
    for (const key of ["made", "shrunk", "failed"]) total[key] += count[key];
  }
  console.log(
    `Нийт ${total.images} зураг: ${total.made} хувилбар үүсгэв` +
      (shrinkMain ? `, ${total.shrunk} main багасгав` : "") +
      (total.failed ? `, ${total.failed} алгасав (main-аараа харагдана)` : ""),
  );
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
