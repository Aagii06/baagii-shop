"use strict";

// Категори, үзүүлэлт нь дэлгүүр бүрт өөр — seed-ээр орсон бэлэн каталог зөвхөн UVS-ийнх.
// Ajrug-д seed-ээр (created_at = seedAt) орсон категори, үзүүлэлтийг устгана; тэд admin-аас өөрсдөө оруулна.
// Ajrug-д бараа (ямар ч төлөвтэй) байвал юу ч хийхгүй — бараа эдгээрт холбогдсон байж болно.
const seedAt = "2026-10-31 00:00:00";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const query = (sql, replacements = []) => queryInterface.sequelize.query(sql, { replacements });
    const [[shop]] = await query("SELECT id FROM shops WHERE code = 'ajrug'");
    if (!shop) return;
    const [[{ cnt }]] = await query("SELECT COUNT(*) AS cnt FROM products WHERE shop_id = ?", [shop.id]);
    if (cnt > 0) {
      console.log(`Ajrug-д ${cnt} бараа байгаа тул seed каталогийг устгасангүй`);
      return;
    }

    const [cats] = await query("SELECT id FROM categories WHERE shop_id = ? AND created_at = ?", [shop.id, seedAt]);
    const catIds = cats.map((r) => r.id);
    if (catIds.length) {
      await queryInterface.bulkDelete("categoryAttrs", { category_id: catIds }, {});
      await queryInterface.bulkDelete("categories", { id: catIds }, {});
    }

    const [rows] = await query("SELECT id FROM attrs WHERE shop_id = ? AND created_at = ?", [shop.id, seedAt]);
    const attrIds = rows.map((r) => r.id);
    if (attrIds.length) {
      await queryInterface.bulkDelete("categoryAttrs", { attr_id: attrIds }, {});
      await queryInterface.bulkDelete("attrValues", { attr_id: attrIds }, {});
      await queryInterface.bulkDelete("attrs", { id: attrIds }, {});
    }
  },

  // Устгасан seed-ийг буцааж оруулахгүй
  async down() {},
};
