"use strict";

// Нийслэл эхэнд, дараа нь 21 аймаг. Улаанбаатарын дүүрэг, хороодыг бүрэн оруулна;
// аймгийн сумдыг шаардлагатай үед нэмнэ (сумгүй аймагт вэб сонголтыг идэвхгүй харуулна).
const aimags = [
  "Архангай", "Баян-Өлгий", "Баянхонгор", "Булган", "Говь-Алтай", "Говьсүмбэр", "Дархан-Уул", "Дорноговь", "Дорнод", "Дундговь", "Завхан",
  "Орхон", "Өвөрхангай", "Өмнөговь", "Сүхбаатар", "Сэлэнгэ", "Төв", "Увс", "Ховд", "Хөвсгөл", "Хэнтий",
];
// Дүүрэг → хорооны тоо
const ubDistricts = [
  ["Багануур", 5], ["Багахангай", 2], ["Баянгол", 34], ["Баянзүрх", 43], ["Налайх", 8],
  ["Сонгинохайрхан", 43], ["Сүхбаатар", 20], ["Хан-Уул", 25], ["Чингэлтэй", 24],
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [rows] = await queryInterface.sequelize.query("SELECT COUNT(*) AS cnt FROM locations");
    if (rows[0].cnt > 0) return;

    await queryInterface.bulkInsert("locations", [
      { level: "city", code: "UB", name: "Улаанбаатар", sort_order: 0 },
      ...aimags.map((name, i) => ({ level: "city", name, sort_order: i + 1 })),
    ]);
    const [[ub]] = await queryInterface.sequelize.query("SELECT id FROM locations WHERE code = 'UB'");
    await queryInterface.bulkInsert(
      "locations",
      ubDistricts.map(([name], i) => ({ parent_id: ub.id, level: "district", name, sort_order: i })),
    );
    const [districts] = await queryInterface.sequelize.query("SELECT id, name FROM locations WHERE level = 'district' AND parent_id = ?", {
      replacements: [ub.id],
    });
    await queryInterface.bulkInsert(
      "locations",
      districts.flatMap((d) =>
        Array.from({ length: ubDistricts.find(([name]) => name === d.name)[1] }, (_, i) => ({
          parent_id: d.id,
          level: "subDistrict",
          name: `${i + 1}-р хороо`,
          sort_order: i,
        })),
      ),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("locations", {}, {});
  },
};
