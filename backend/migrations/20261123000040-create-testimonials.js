"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "testimonials",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        shop_id: { type: Sequelize.INTEGER, allowNull: false },
        quote: { type: Sequelize.TEXT },
        name: { type: Sequelize.STRING },
        role: { type: Sequelize.STRING },
        rating: { type: Sequelize.INTEGER, defaultValue: 5 },
        sort_order: { type: Sequelize.INTEGER, defaultValue: 0 },
        is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
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
    await queryInterface.addIndex("testimonials", ["shop_id", "status"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("testimonials");
  },
};
