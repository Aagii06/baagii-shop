"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "attrs",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        code: { type: Sequelize.STRING },
        name: { type: Sequelize.STRING },
        short_name: { type: Sequelize.STRING },
        // text | number | date | boolean | select
        value_type: { type: Sequelize.STRING },
        description: { type: Sequelize.STRING },
        image: { type: Sequelize.STRING },
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable("attrs");
  },
};
