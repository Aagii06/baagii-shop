"use strict";

// Хаягийн төрөл, хүргэлтийн бэлэн тэмдэглэл, барааны сонголтын анхны каталог
const at = "2026-10-31 00:00:00";

const addressTypes = [
  { code: "home", name: "Гэр", style: { bgColor: "#e0f2fe", txtColor: "#0369a1" }, icon: "home", sort_order: 0 },
  { code: "work", name: "Ажил", style: { bgColor: "#fef3c7", txtColor: "#b45309" }, icon: "briefcase", sort_order: 1 },
  { code: "other", name: "Бусад", style: { bgColor: "#f3e8ff", txtColor: "#7e22ce" }, icon: "map-pin", sort_order: 2 },
];

const doNotes = [
  { name: "Хүргэхээс өмнө залгах", description: "Хүргэлтийн ажилтан ирэхээсээ өмнө утсаар холбогдоно" },
  { name: "Хаалганы өмнө үлдээх", description: "Хүлээн авагч байхгүй бол хаалганы өмнө үлдээнэ" },
  { name: "Харуулд үлдээх", description: "Байрны харуул, ресепшинд хүлээлгэн өгнө" },
];

const attrs = [
  {
    name: "Өнгө",
    values: [
      ["Хар", "#111111"], ["Цагаан", "#ffffff"], ["Саарал", "#9ca3af"], ["Улаан", "#dc2626"], ["Цэнхэр", "#2563eb"],
      ["Ногоон", "#16a34a"], ["Шар", "#facc15"], ["Бор", "#92400e"], ["Ягаан", "#ec4899"],
    ],
  },
  { name: "Хувцасны хэмжээ (үсэг)", values: ["XS", "S", "M", "L", "XL", "XXL"] },
  { name: "Хувцасны хэмжээ (тоо)", values: ["44", "46", "48", "50", "52", "54"] },
  { name: "Гутлын хэмжээ", values: ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"] },
  { name: "Багтаамж", values: ["64 ГБ", "128 ГБ", "256 ГБ", "512 ГБ", "1 ТБ"] },
];

const json = (rows, fields) => rows.map((r) => ({ ...r, ...Object.fromEntries(fields.map((f) => [f, JSON.stringify(r[f])])) }));

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const count = async (table) => (await queryInterface.sequelize.query(`SELECT COUNT(*) AS cnt FROM ${table}`))[0][0].cnt;

    if (!(await count("addressTypes"))) await queryInterface.bulkInsert("addressTypes", json(addressTypes, ["style"]));
    if (!(await count("doNotes")))
      await queryInterface.bulkInsert("doNotes", doNotes.map((n) => ({ ...n, status: "active", created_at: at })));
    if (!(await count("attrs"))) {
      for (const attr of attrs) {
        await queryInterface.bulkInsert("attrs", [{ name: attr.name, value_type: "select", status: "active", created_at: at }]);
        const [[{ id }]] = await queryInterface.sequelize.query("SELECT MAX(id) AS id FROM attrs");
        await queryInterface.bulkInsert(
          "attrValues",
          attr.values.map((v, i) => {
            const [name, color] = Array.isArray(v) ? v : [v, null];
            return { attr_id: id, name, color, order_number: i, status: "active", created_at: at };
          }),
        );
      }
    }
  },

  async down(queryInterface) {
    for (const table of ["attrValues", "attrs", "doNotes", "addressTypes"]) await queryInterface.bulkDelete(table, {}, {});
  },
};
