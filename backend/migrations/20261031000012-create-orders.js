"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "orders",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        customer_id: { type: Sequelize.INTEGER },
        // web | admin
        source: { type: Sequelize.STRING },
        // pending | confirmed | delivered | returned (config/constants.js)
        status: { type: Sequelize.STRING, defaultValue: "pending" },
        customer_name: { type: Sequelize.STRING },
        phone: { type: Sequelize.STRING },
        extra_phone: { type: Sequelize.STRING },
        email: { type: Sequelize.STRING },
        address: { type: Sequelize.STRING(1000) },
        address_label: { type: Sequelize.STRING },
        address_type_id: { type: Sequelize.INTEGER },
        city_id: { type: Sequelize.INTEGER },
        district_id: { type: Sequelize.INTEGER },
        sub_district_id: { type: Sequelize.INTEGER },
        note: { type: Sequelize.STRING(1000) },
        subtotal: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
        delivery_fee: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
        coupon_code: { type: Sequelize.STRING },
        coupon_amount: { type: Sequelize.DECIMAL(14, 2), defaultValue: 0 },
        payment_method: { type: Sequelize.STRING },
        paid_at: { type: Sequelize.STRING },
        confirmed_at: { type: Sequelize.STRING },
        delivered_at: { type: Sequelize.STRING },
        returned_at: { type: Sequelize.STRING },
        created_by: { type: Sequelize.INTEGER },
        updated_by: { type: Sequelize.INTEGER },
        created_at: { type: Sequelize.STRING },
        updated_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("orders", ["customer_id"]);
    await queryInterface.addIndex("orders", ["status"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("orders");
  },
};
