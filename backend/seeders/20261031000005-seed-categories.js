"use strict";

// UVS-ийн анхны категориуд (2 түвшин). attrs нь тухайн категорийн бараанд сонгох
// сонголтууд (seed-lookups-ийн attrs-ийн нэрээр, дээд тал нь 3).
// Бусад дэлгүүр (Ajrug г.м.) категориа admin-аас өөрсдөө оруулна.
const at = "2026-10-31 00:00:00";

const COLOR = "Өнгө";
const SIZE = "Хувцасны хэмжээ (үсэг)";
const SHOE = "Гутлын хэмжээ";
const STORAGE = "Багтаамж";

const trees = {
  uvs: [
    {
      code: "women",
      name: "Эмэгтэй хувцас",
      attrs: [COLOR, SIZE],
      children: ["Даашинз", "Цамц", "Өмд, юбка", "Гадуур хувцас"],
    },
    {
      code: "men",
      name: "Эрэгтэй хувцас",
      attrs: [COLOR, SIZE],
      children: ["Цамц", "Өмд", "Гадуур хувцас", "Костюм"],
    },
    {
      code: "shoes",
      name: "Гутал, дагалдах хэрэгсэл",
      attrs: [COLOR, SHOE],
      children: ["Эмэгтэй гутал", "Эрэгтэй гутал", { name: "Цүнх", attrs: [COLOR] }, { name: "Дагалдах хэрэгсэл", attrs: [COLOR] }],
    },
    {
      code: "electronics",
      name: "Электроника",
      attrs: [COLOR],
      children: [{ name: "Гар утас", attrs: [COLOR, STORAGE] }, "Чихэвч", "Ухаалаг цаг", "Утасны дагалдах хэрэгсэл"],
    },
    { code: "home", name: "Гэр ахуй", attrs: [COLOR], children: ["Гал тогоо", "Гэрийн чимэглэл", "Ор дэрний цагаан хэрэглэл"] },
    { code: "beauty", name: "Гоо сайхан", attrs: [], children: ["Арьс арчилгаа", "Нүүр будалт", "Үнэртэн"] },
    {
      code: "sport",
      name: "Спорт, аялал",
      attrs: [COLOR],
      children: [{ name: "Спорт хувцас", attrs: [COLOR, SIZE] }, "Спорт хэрэгсэл", "Аяллын хэрэгсэл"],
    },
  ],
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const query = (sql, replacements = []) => queryInterface.sequelize.query(sql, { replacements });
    const lastId = async (table) => (await query(`SELECT MAX(id) AS id FROM ${table}`))[0][0].id;

    for (const [code, tree] of Object.entries(trees)) {
      const [[shop]] = await query("SELECT id FROM shops WHERE code = ?", [code]);
      if (!shop) continue;
      const shop_id = shop.id;
      const [[{ cnt }]] = await query("SELECT COUNT(*) AS cnt FROM categories WHERE shop_id = ? AND status = 'active'", [shop_id]);
      if (cnt > 0) continue;

      const [attrRows] = await query("SELECT id, name FROM attrs WHERE shop_id = ? AND status = 'active'", [shop_id]);
      const attrId = new Map(attrRows.map((a) => [a.name, a.id]));
      const insert = async ({ parent_id, code, name, attrs }, order_number) => {
        await queryInterface.bulkInsert("categories", [{ shop_id, parent_id, code, name, order_number, status: "active", created_at: at }]);
        const id = await lastId("categories");
        const ids = attrs.map((a) => attrId.get(a)).filter(Boolean);
        if (ids.length) await queryInterface.bulkInsert("categoryAttrs", ids.map((attr_id, i) => ({ category_id: id, attr_id, order_number: i })));
        return id;
      };

      for (const [i, root] of tree.entries()) {
        const parent_id = await insert({ parent_id: null, code: root.code, name: root.name, attrs: root.attrs }, i);
        for (const [j, child] of root.children.entries()) {
          const { name, attrs = root.attrs } = typeof child === "string" ? { name: child } : child;
          await insert({ parent_id, code: `${root.code}-${j + 1}`, name, attrs }, j);
        }
      }
    }
  },

  async down(queryInterface) {
    const [rows] = await queryInterface.sequelize.query("SELECT id FROM categories WHERE created_at = ?", { replacements: [at] });
    const ids = rows.map((r) => r.id);
    if (!ids.length) return;
    await queryInterface.bulkDelete("categoryAttrs", { category_id: ids }, {});
    await queryInterface.bulkDelete("categories", { id: ids }, {});
  },
};
