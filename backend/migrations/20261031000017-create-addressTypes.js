"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "addressTypes",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        code: { type: Sequelize.STRING },
        name: { type: Sequelize.STRING },
        // { bgColor, txtColor }
        style: { type: Sequelize.JSON },
        icon: { type: Sequelize.STRING },
        sort_order: { type: Sequelize.INTEGER, defaultValue: 0 },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("addressTypes");
  },
};
