// Нэг удаагийн: stores.logo, users.logo-ийн зургийг public/uploads/products-оос
// stores, users folder руу зөөж, эх + thumb_ + icon_ + grid_ хувилбаруудыг үүсгэнэ.
// Дахин ажиллуулахад аюулгүй (зөөгдсөнийг алгасна). Сервер дээр: node scripts/moveLogos.js
require("../config/env");
const fs = require("fs");
const path = require("path");
const db = require("../models");
const { folderPath, findFile, makeVariants, variantName, VARIANTS } = require("../helper/fileHelper");

const move = async (folder, fileName) => {
  const dir = folderPath(folder);
  await fs.promises.mkdir(dir, { recursive: true });
  const target = path.join(dir, fileName);
  if (!fs.existsSync(target)) {
    const source = findFile(fileName);
    if (!source) return "олдсонгүй";
    await fs.promises.rename(source, target);
  }
  // Хуучин folder-т үлдсэн хувилбаруудыг (thumb_ г.м.) мөн зөөнө
  for (const variant of Object.keys(VARIANTS)) {
    const name = variantName(variant, fileName);
    const old = findFile(name);
    if (old && path.dirname(old) !== dir) await fs.promises.rename(old, path.join(dir, name));
  }
  await makeVariants(folder, fileName);
  return "ok";
};

(async () => {
  for (const folder of ["stores", "users"]) {
    const [rows] = await db.sequelize.query(`SELECT id, logo FROM ${folder} WHERE logo IS NOT NULL AND logo <> ''`);
    for (const row of rows) console.log(folder, row.id, row.logo, await move(folder, path.basename(row.logo)));
  }
  await db.sequelize.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
