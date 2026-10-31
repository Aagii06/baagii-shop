"use strict";

// Дэлгүүр бүрийн анхны категориуд (2 түвшин). attrs нь тухайн категорийн бараанд сонгох
// сонголтууд (seed-lookups-ийн attrs-ийн нэрээр, дээд тал нь 3).
// Ajrug зөвхөн хүүхдийн хувцас зардаг тул насаар нь хэмжээтэй сонголт нэмнэ.
const at = "2026-10-31 00:00:00";

const COLOR = "Өнгө";
const SIZE = "Хувцасны хэмжээ (үсэг)";
const SHOE = "Гутлын хэмжээ";
const STORAGE = "Багтаамж";
const KIDS = "Хүүхдийн хэмжээ (нас)";

const kidsSizes = ["0-3 сар", "3-6 сар", "6-12 сар", "1-2 нас", "2-3 нас", "3-4 нас", "4-5 нас", "5-6 нас", "7-8 нас", "9-10 нас", "11-12 нас"];

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
  ajrug: [
    {
      code: "baby",
      name: "Нярайн хувцас",
      attrs: [COLOR, KIDS],
      children: ["Боди", "Комбинезон", "Нярайн иж бүрдэл", "Малгай, бээлий"],
    },
    { code: "girls", name: "Охины хувцас", attrs: [COLOR, KIDS], children: ["Даашинз", "Цамц", "Өмд, юбка", "Иж бүрдэл"] },
    { code: "boys", name: "Хүүгийн хувцас", attrs: [COLOR, KIDS], children: ["Цамц", "Өмд", "Иж бүрдэл"] },
    { code: "outerwear", name: "Гадуур хувцас", attrs: [COLOR, KIDS], children: ["Куртик", "Өвлийн комбинезон", "Ноосон цамц"] },
    { code: "sleepwear", name: "Унтлагын хувцас", attrs: [COLOR, KIDS], children: ["Унтлагын иж бүрдэл", "Халат"] },
    { code: "school", name: "Сургуулийн хувцас", attrs: [COLOR, KIDS], children: ["Дүрэмт хувцас", "Цамц", "Өмд, юбка"] },
    { code: "underwear", name: "Дотуур хувцас, оймс", attrs: [COLOR, KIDS], children: ["Дотуур хувцас", "Оймс", "Колготк"] },
    { code: "kids-sport", name: "Спорт хувцас", attrs: [COLOR, KIDS], children: [] },
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

      if (code === "ajrug") {
        const [[kids]] = await query("SELECT id FROM attrs WHERE shop_id = ? AND name = ? AND status = 'active'", [shop_id, KIDS]);
        if (!kids) {
          await queryInterface.bulkInsert("attrs", [{ shop_id, name: KIDS, value_type: "select", status: "active", created_at: at }]);
          const id = await lastId("attrs");
          await queryInterface.bulkInsert(
            "attrValues",
            kidsSizes.map((name, i) => ({ attr_id: id, name, order_number: i, status: "active", created_at: at })),
          );
        }
      }

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
