"use strict";

// Admin-аас захиалга үүсгэхэд хүргэлтийн төлбөр авах эсэх, анхдагч үнэ (дэлгүүр бүрт).

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("paymentSettings", "delivery_enabled", { type: Sequelize.BOOLEAN, defaultValue: true, after: "qpay_invoice_code" });
    await queryInterface.addColumn("paymentSettings", "delivery_fee", { type: Sequelize.DECIMAL(14, 2), defaultValue: 6000, after: "delivery_enabled" });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("paymentSettings", "delivery_fee");
    await queryInterface.removeColumn("paymentSettings", "delivery_enabled");
  },
};
