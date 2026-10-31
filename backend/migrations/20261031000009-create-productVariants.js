"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "productVariants",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        product_id: { type: Sequelize.INTEGER },
        code: { type: Sequelize.STRING },
        name: { type: Sequelize.STRING },
        main_price: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
        price: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
        // Бүртгэсэн тоо / зарагдаагүй үлдэгдэл (захиалгад хасагдаж, буцаалтад нэмэгдэнэ)
        qty: { type: Sequelize.INTEGER, defaultValue: 0 },
        remain: { type: Sequelize.INTEGER, defaultValue: 0 },
        // [{ attrId, attrName, value, color, image }]
        attr: { type: Sequelize.JSON },
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
    await queryInterface.addIndex("productVariants", ["product_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("productVariants");
  },
};
