"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "attrValues",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        attr_id: { type: Sequelize.INTEGER },
        code: { type: Sequelize.STRING },
        name: { type: Sequelize.STRING },
        name_eng: { type: Sequelize.STRING },
        description: { type: Sequelize.STRING },
        order_number: { type: Sequelize.INTEGER, defaultValue: 0 },
        image: { type: Sequelize.STRING },
        // Өнгөний дугуйн hex (#000000)
        color: { type: Sequelize.STRING },
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
    await queryInterface.addIndex("attrValues", ["attr_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("attrValues");
  },
};
