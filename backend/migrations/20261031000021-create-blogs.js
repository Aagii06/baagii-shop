"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "blogs",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        shop_id: { type: Sequelize.INTEGER, allowNull: false },
        slug: { type: Sequelize.STRING },
        title: { type: Sequelize.STRING },
        excerpt: { type: Sequelize.TEXT },
        tag: { type: Sequelize.STRING },
        author: { type: Sequelize.STRING },
        date: { type: Sequelize.STRING },
        read_minutes: { type: Sequelize.INTEGER },
        image: { type: Sequelize.STRING },
        body: { type: Sequelize.TEXT },
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
    await queryInterface.addIndex("blogs", ["shop_id", "slug"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("blogs");
  },
};
