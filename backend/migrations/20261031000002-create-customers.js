"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "customers",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        phone: { type: Sequelize.STRING },
        name: { type: Sequelize.STRING },
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
    await queryInterface.addIndex("customers", ["phone"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("customers");
  },
};
