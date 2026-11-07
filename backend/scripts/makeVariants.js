// Хуучин зургуудын дутуу жижиг хувилбаруудыг (thumb_, icon_, grid_) public/uploads доторх
// бүх folder-т үүсгэнэ: main + icon_ + thumb_ + grid_ (4 төрөл, хэмжээ нь helper/fileHelper.js VARIANTS).
// Байгаа хувилбарыг алгасна, тиймээс дахин ажиллуулахад аюулгүй.
//   node scripts/makeVariants.js            — дутууг нь үүсгэнэ
//   node scripts/makeVariants.js --force    — бүх хувилбарыг устгаад дахин үүсгэнэ
//   node scripts/makeVariants.js stores     — зөвхөн заасан folder(ууд)
// Зургууд сервер дээр байдаг тул сервер дээр (backend/ дотроос) ажиллуулна.
const fs = require("fs");
const path = require("path");
const { uploadsRoot, folderPath, folderVariants, makeVariants, variantName, VARIANTS } = require("../helper/fileHelper");

const force = process.argv.includes("--force");
const only = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const prefixes = Object.values(VARIANTS).map((v) => v.prefix);
const IMAGE = /\.(jpe?g|png|webp|gif|avif|tiff?)$/i;

(async () => {
  const dirs = fs.readdirSync(uploadsRoot, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  let made = 0;
  let failed = 0;
  for (const folder of dirs.filter((d) => only.length === 0 || only.includes(d))) {
    const dir = folderPath(folder);
    const names = fs.readdirSync(dir).filter((name) => IMAGE.test(name) && !prefixes.some((p) => name.startsWith(p)));
    let folderMade = 0;
    for (const name of names) {
      const wanted = folderVariants(folder).map((variant) => path.join(dir, variantName(variant, name)));
      if (force) for (const file of wanted) fs.rmSync(file, { force: true });
      const missing = wanted.filter((file) => !fs.existsSync(file));
      if (missing.length === 0) continue;
      await makeVariants(folder, name);
      const still = missing.filter((file) => !fs.existsSync(file));
      folderMade += missing.length - still.length;
      if (still.length) {
        failed++;
        console.log(`  уншиж чадсангүй: ${folder}/${name}`);
      }
    }
    if (names.length) console.log(`${folder}: ${names.length} зураг, ${folderMade} хувилбар үүсгэв`);
    made += folderMade;
  }
  console.log(`Нийт ${made} хувилбар үүсгэв${failed ? `, ${failed} зураг алгасав (эх зургаараа харагдана)` : ""}`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
