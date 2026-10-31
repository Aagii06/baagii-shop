"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "cartDetails",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        cart_id: { type: Sequelize.INTEGER },
        variant_id: { type: Sequelize.INTEGER },
        qty: { type: Sequelize.INTEGER, defaultValue: 0 },
        created_at: { type: Sequelize.STRING },
        updated_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("cartDetails", ["cart_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("cartDetails");
  },
};
