"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "locations",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        // Аймаг/Нийслэл → Сум/Дүүрэг → Баг/Хороо
        parent_id: { type: Sequelize.INTEGER },
        // city | district | subDistrict
        level: { type: Sequelize.STRING },
        code: { type: Sequelize.STRING },
        name: { type: Sequelize.STRING },
        sort_order: { type: Sequelize.INTEGER, defaultValue: 0 },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("locations", ["parent_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("locations");
  },
};
