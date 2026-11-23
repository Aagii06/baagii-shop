"use strict";

// Ajrug (хүүхдийн хувцас)-ын категори, сонголтууд — seeders/data/ajrug-categories.json.
//
// Энэ backend-д attr нь барааны ХУВИЛБАРЫН сонголт (хэмжээ, өнгө) — категорид
// холбосон attr бүрээр хувилбар үүснэ (дээд тал нь 3). Тиймээс JSON-ий
// `level: "variant"` attr-уудыг л категорид холбоно; `level: "product"`
// (хүйс, нас, улирал, материал) attr-ууд үүсэх боловч категорид холбогдохгүй,
// утгагүй "Брэнд" үүсэхгүй.
//
// Ajrug-д идэвхтэй категори аль хэдийн байвал юу ч хийхгүй (давхардахгүй).
//   npx sequelize-cli db:seed --seed 20261123000006-seed-ajrug-categories.js
const data = require("./data/ajrug-categories.json");

const at = "2026-11-23 00:00:00";
const SHOP_CODE = "ajrug";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const query = (sql, replacements = []) => queryInterface.sequelize.query(sql, { replacements });
    const t = await queryInterface.sequelize.transaction();
    const q = (sql, replacements = []) => queryInterface.sequelize.query(sql, { replacements, transaction: t });
    const insertId = async (table, row) => {
      const cols = Object.keys(row);
      const [id] = await q(
        `INSERT INTO \`${table}\` (${cols.map((c) => `\`${c}\``).join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
        cols.map((c) => (row[c] !== null && typeof row[c] === "object" ? JSON.stringify(row[c]) : row[c])),
      );
      return id;
    };

    const [[shop]] = await query("SELECT id FROM shops WHERE code = ?", [SHOP_CODE]);
    if (!shop) return;
    const shop_id = shop.id;
    const [[{ cnt }]] = await query("SELECT COUNT(*) AS cnt FROM categories WHERE shop_id = ? AND status = 'active'", [shop_id]);
    if (cnt > 0) {
      console.log(`Ajrug-д ${cnt} категори байгаа тул алгаслаа.`);
      return;
    }

    try {
      // 1. Сонголтууд (attrs) ба утгууд — нэрээр давхардахгүй
      const attrId = new Map();
      for (const attr of data.attributes) {
        if (attr.values.length === 0) continue;
        const [[existing]] = await q("SELECT id FROM attrs WHERE shop_id = ? AND name = ? AND status = 'active'", [shop_id, attr.name]);
        const id =
          existing?.id ??
          (await insertId("attrs", {
            shop_id,
            code: attr.code,
            name: attr.name,
            value_type: "select",
            description: attr.level === "variant" ? "Хувилбарын сонголт" : "Барааны шинж",
            status: "active",
            created_at: at,
          }));
        attrId.set(attr.code, { id, level: attr.level });
        if (existing) continue;
        for (const [i, v] of attr.values.entries()) {
          await insertId("attrValues", {
            attr_id: id,
            code: v.slug,
            name: v.value,
            description: v.hint ?? null,
            color: v.hex ?? null,
            order_number: i,
            status: "active",
            created_at: at,
          });
        }
      }

      // 2. Категорийн мод; хувилбарын attr-уудыг (дээд тал нь 3) бүх түвшинд холбоно
      const variantAttrs = (codes) =>
        codes.map((c) => attrId.get(c)).filter((a) => a && a.level === "variant").map((a) => a.id).slice(0, 3);
      const insertTree = async (node, parent_id, attrs) => {
        const id = await insertId("categories", {
          shop_id,
          parent_id,
          code: node.slug,
          name: node.name,
          order_number: node.sort_order ?? 0,
          status: "active",
          created_at: at,
        });
        for (const [i, attr_id] of attrs.entries()) await insertId("categoryAttrs", { category_id: id, attr_id, order_number: i });
        for (const child of node.children ?? []) await insertTree(child, id, attrs);
      };
      for (const root of data.categories) await insertTree(root, null, variantAttrs(root.attributes ?? []));

      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },

  // Зөвхөн энэ seeder-ийн үүсгэсэн мөрүүдийг (Ajrug, created_at = at) устгана
  async down(queryInterface) {
    const query = (sql, replacements = []) => queryInterface.sequelize.query(sql, { replacements });
    const [[shop]] = await query("SELECT id FROM shops WHERE code = ?", [SHOP_CODE]);
    if (!shop) return;
    await query(
      "DELETE ca FROM categoryAttrs ca JOIN categories c ON c.id = ca.category_id WHERE c.shop_id = ? AND c.created_at = ?",
      [shop.id, at],
    );
    await query("DELETE FROM categories WHERE shop_id = ? AND created_at = ?", [shop.id, at]);
    await query("DELETE av FROM attrValues av JOIN attrs a ON a.id = av.attr_id WHERE a.shop_id = ? AND av.created_at = ?", [shop.id, at]);
    await query("DELETE FROM attrs WHERE shop_id = ? AND created_at = ?", [shop.id, at]);
  },
};
