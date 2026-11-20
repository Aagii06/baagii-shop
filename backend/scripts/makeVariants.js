// Хуучин (өмнө нь бүртгэгдсэн) зургуудыг 4 төрөлтэй болгоно: main + icon_ + thumb_ + grid_
// (хэмжээ нь helper/fileHelper.js VARIANTS). public/uploads доторх бүх folder-т, эсвэл заасанд нь.
// Байгаа хувилбарыг алгасна, тиймээс дахин ажиллуулахад аюулгүй.
//   node scripts/makeVariants.js                    — дутуу хувилбаруудыг үүсгэнэ
//   node scripts/makeVariants.js products           — зөвхөн заасан folder(ууд)
//   node scripts/makeVariants.js --force            — хувилбаруудыг устгаад шинэ хэмжээгээр дахин үүсгэнэ
//   node scripts/makeVariants.js --main             — 800×800-аас том main зургийг 800×800-д багтааж,
//                                                     шахна (эх зураг солигдоно — буцаах боломжгүй)
//   node scripts/makeVariants.js --webp             — хуучин JPG/PNG (main + хувилбар) бүрийн хажууд WEBP хуулбар
//                                                     (abc.png.webp) үүсгэнэ; /file/... түүнийг нь илгээнэ.
//                                                     Эх файл үлдэнэ — хуулбаруудыг устгавал буцаад эх нь харагдана.
// Жишээ нь хуучин зургуудыг бүрэн шинэчлэх: node scripts/makeVariants.js --force --main --webp
// Зургууд сервер дээр байдаг тул сервер дээр (backend/ дотроос) ажиллуулна.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const {
  uploadsRoot, folderPath, folderVariants, makeVariants, variantName, VARIANTS, MAIN_SIZE, resizeImage,
  isWebpCopy, webpCopyName, makeWebpCopy,
} = require("../helper/fileHelper");

const force = process.argv.includes("--force");
const shrinkMain = process.argv.includes("--main");
const webp = process.argv.includes("--webp");
const only = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const prefixes = Object.values(VARIANTS).map((v) => v.prefix);
const RESIZABLE = /\.(jpe?g|png|webp)$/i;

// main-ийг MAIN_SIZE×MAIN_SIZE-д багтааж шахна (түр файлд бичээд сольно). Багассан бол true
const resizeMain = async (file) => {
  const { width, height } = await sharp(file).metadata();
  if (!width || !height || Math.max(width, height) <= MAIN_SIZE) return false;
  const tmp = `${file}.tmp${path.extname(file)}`;
  await resizeImage(file, MAIN_SIZE, tmp);
  await fs.promises.rename(tmp, file);
  return true;
};

(async () => {
  const dirs = fs.readdirSync(uploadsRoot, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  const total = { images: 0, made: 0, shrunk: 0, webp: 0, failed: 0 };
  for (const folder of dirs.filter((d) => only.length === 0 || only.includes(d))) {
    const dir = folderPath(folder);
    const names = fs
      .readdirSync(dir)
      .filter((name) => RESIZABLE.test(name) && !isWebpCopy(name) && !prefixes.some((p) => name.startsWith(p)));
    const count = { made: 0, shrunk: 0, webp: 0, failed: 0 };
    for (const name of names) {
      try {
        const wanted = folderVariants(folder).map((variant) => path.join(dir, variantName(variant, name)));
        // Хувилбартай нь хамт хуучин WEBP хуулбаруудыг устгана (шинээр үүсгэнэ)
        if (force) for (const file of wanted) for (const f of [file, webpCopyName(file)]) fs.rmSync(f, { force: true });
        const missing = wanted.filter((file) => !fs.existsSync(file));
        // Хувилбаруудыг эх (том) зургаас нь эхэлж үүсгээд, дараа нь main-ийг багасгана
        if (missing.length) await makeVariants(folder, name);
        count.made += missing.filter((file) => fs.existsSync(file)).length;
        if (missing.some((file) => !fs.existsSync(file))) throw new Error("хувилбар үүссэнгүй");
        if (shrinkMain && (await resizeMain(path.join(dir, name)))) count.shrunk++;
        // main + хувилбар бүрийн WEBP хуулбар (эх нь шинэчлэгдсэн бол дахин үүсгэнэ)
        if (webp)
          for (const file of [path.join(dir, name), ...wanted])
            if ((await makeWebpCopy(file)) === "made") count.webp++;
      } catch (error) {
        count.failed++;
        console.log(`  алгасав: ${folder}/${name} — ${error.message}`);
      }
    }
    if (names.length)
      console.log(
        `${folder}: ${names.length} зураг, ${count.made} хувилбар үүсгэв` +
          (shrinkMain ? `, ${count.shrunk} main багасгав` : "") +
          (webp ? `, ${count.webp} WEBP хуулбар` : ""),
      );
    total.images += names.length;
    for (const key of ["made", "shrunk", "webp", "failed"]) total[key] += count[key];
  }
  console.log(
    `Нийт ${total.images} зураг: ${total.made} хувилбар үүсгэв` +
      (shrinkMain ? `, ${total.shrunk} main багасгав` : "") +
      (webp ? `, ${total.webp} WEBP хуулбар үүсгэв` : "") +
      (total.failed ? `, ${total.failed} алгасав (main-аараа харагдана)` : ""),
  );
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
