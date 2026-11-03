"use strict";

// Дэлгүүр бүрийн төлбөрийн тохиргоо (дансаар шилжүүлэх, QPay) ба QPay нэхэмжлэх.
// Админ самбарын "Төлбөрийн тохиргоо"-оос засна (api/paymentSetting).
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "paymentSettings",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        shop_id: { type: Sequelize.INTEGER, allowNull: false, unique: true },
        // Дансаар шилжүүлэх — худалдан авагч шилжүүлээд, админ захиалгыг баталгаажуулахад төлөгдсөн болно
        bank_enabled: { type: Sequelize.BOOLEAN, defaultValue: false },
        bank_name: { type: Sequelize.STRING },
        bank_account_name: { type: Sequelize.STRING },
        bank_account_number: { type: Sequelize.STRING },
        bank_iban: { type: Sequelize.STRING },
        // QPay merchant (https://merchant.qpay.mn) — sandbox нь merchant-sandbox.qpay.mn
        qpay_enabled: { type: Sequelize.BOOLEAN, defaultValue: false },
        qpay_sandbox: { type: Sequelize.BOOLEAN, defaultValue: true },
        qpay_username: { type: Sequelize.STRING },
        qpay_password: { type: Sequelize.STRING },
        qpay_invoice_code: { type: Sequelize.STRING },
        updated_by: { type: Sequelize.INTEGER },
        created_at: { type: Sequelize.STRING },
        updated_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );

    await queryInterface.createTable(
      "qpayInvoices",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        shop_id: { type: Sequelize.INTEGER, allowNull: false },
        order_id: { type: Sequelize.INTEGER, allowNull: false },
        // Манай талын давтагдашгүй дугаар — QPay-ийн callback URL-д мөн орно
        sender_invoice_no: { type: Sequelize.STRING(45), allowNull: false, unique: true },
        invoice_id: { type: Sequelize.STRING },
        amount: { type: Sequelize.DECIMAL(14, 2) },
        // pending | paid
        status: { type: Sequelize.STRING, defaultValue: "pending" },
        qr_text: { type: Sequelize.TEXT },
        qr_image: { type: Sequelize.TEXT("medium") },
        short_url: { type: Sequelize.STRING },
        // Банкны апп руу шилжих холбоосууд (JSON)
        urls: { type: Sequelize.TEXT },
        payment_id: { type: Sequelize.STRING },
        paid_at: { type: Sequelize.STRING },
        created_at: { type: Sequelize.STRING },
        updated_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("qpayInvoices", ["order_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("qpayInvoices");
    await queryInterface.dropTable("paymentSettings");
  },
};
