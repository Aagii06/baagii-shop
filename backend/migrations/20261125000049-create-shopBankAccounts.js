"use strict";

// Дэлгүүрийн "Дансаар төлөх" данснууд (5 хүртэл, эхнийх нь үндсэн). Худалдан авагч аль нэг рүү нь шилжүүлнэ.
// paymentSettings.bank_* баганууд үлдэнэ — эхний дансыг тусгаж хадгална (хуучин app-ууд уншина).
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "shopBankAccounts",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        shop_id: { type: Sequelize.INTEGER, allowNull: false },
        bank_name: { type: Sequelize.STRING(100), allowNull: false },
        account_number: { type: Sequelize.STRING(50), allowNull: false },
        account_name: { type: Sequelize.STRING(150), allowNull: false },
        iban: { type: Sequelize.STRING(50) },
        sort: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("shopBankAccounts", ["shop_id"]);
    // Одоогийн ганц дансыг шилжүүлнэ
    await queryInterface.sequelize.query(
      `INSERT INTO shopBankAccounts (shop_id, bank_name, account_number, account_name, iban, sort)
       SELECT shop_id, COALESCE(bank_name, ''), bank_account_number, COALESCE(bank_account_name, ''), bank_iban, 0
         FROM paymentSettings WHERE bank_account_number IS NOT NULL AND bank_account_number <> ''`,
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("shopBankAccounts");
  },
};
