"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "categories",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        parent_id: { type: Sequelize.INTEGER },
        code: { type: Sequelize.STRING },
        name: { type: Sequelize.STRING },
        image: { type: Sequelize.STRING },
        // { borderColor, txtColor, bgColor, icon }
        style: { type: Sequelize.JSON },
        childs: { type: Sequelize.JSON },
        order_number: { type: Sequelize.INTEGER, defaultValue: 0 },
        status: { type: Sequelize.STRING, defaultValue: "active" },
        created_by: { type: Sequelize.INTEGER },
        updated_by: { type: Sequelize.INTEGER },
        deleted_by: { type: Sequelize.INTEGER },
        created_at: { type: Sequelize.STRING },
        updated_at: { type: Sequelize.STRING },
        deleted_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("categories", ["parent_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("categories");
  },
};
