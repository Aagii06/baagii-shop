"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "products",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        category_id: { type: Sequelize.INTEGER },
        date: { type: Sequelize.STRING },
        name: { type: Sequelize.STRING },
        title: { type: Sequelize.STRING },
        description: { type: Sequelize.TEXT },
        // Файлын нэрс (file/router.js-ээр харуулна)
        images: { type: Sequelize.JSON },
        // Барааны сонголтууд, утга бүрийн зурагтай нь (helper/productHelper.js)
        attrs: { type: Sequelize.JSON },
        qty: { type: Sequelize.INTEGER, defaultValue: 0 },
        main_price: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
        price: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
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
    await queryInterface.addIndex("products", ["category_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("products");
  },
};
