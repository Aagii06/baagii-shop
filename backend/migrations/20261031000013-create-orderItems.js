"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "orderItems",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        order_id: { type: Sequelize.INTEGER },
        product_id: { type: Sequelize.INTEGER },
        variant_id: { type: Sequelize.INTEGER },
        // Захиалах үеийн нэр, зураг, үнэ (бараа өөрчлөгдсөн ч хэвээр)
        name: { type: Sequelize.STRING },
        image: { type: Sequelize.STRING },
        qty: { type: Sequelize.INTEGER, defaultValue: 0 },
        price: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
        returned_qty: { type: Sequelize.INTEGER, defaultValue: 0 },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("orderItems", ["order_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("orderItems");
  },
};
