"use strict";

// Дэлгүүр олон данстай байж болно: stores.bank_* баганыг storeBankAccounts хүснэгт рүү шилжүүлнэ.
// Данс зөвхөн хуулж авахад (тооцоог банкны апп-аар шилжүүлнэ) — эндээс мөнгө явахгүй.
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "storeBankAccounts",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        shop_id: { type: Sequelize.INTEGER, allowNull: false },
        store_id: { type: Sequelize.INTEGER, allowNull: false },
        bank_name: { type: Sequelize.STRING(100) },
        account: { type: Sequelize.STRING(50), allowNull: false },
        holder: { type: Sequelize.STRING(150) },
        // Дараалал — 0 нь үндсэн данс
        sort: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("storeBankAccounts", ["shop_id", "store_id"]);
    // Өмнөх ганц дансыг (байвал) шилжүүлнэ
    await queryInterface.sequelize.query(
      `INSERT INTO storeBankAccounts (shop_id, store_id, bank_name, account, holder, sort)
       SELECT shop_id, id, bank_name, bank_account, bank_holder, 0 FROM stores WHERE bank_account IS NOT NULL AND bank_account <> ''`,
    );
    await queryInterface.removeColumn("stores", "bank_holder");
    await queryInterface.removeColumn("stores", "bank_account");
    await queryInterface.removeColumn("stores", "bank_name");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("stores", "bank_name", { type: Sequelize.STRING(100), allowNull: true, after: "logo" });
    await queryInterface.addColumn("stores", "bank_account", { type: Sequelize.STRING(50), allowNull: true, after: "bank_name" });
    await queryInterface.addColumn("stores", "bank_holder", { type: Sequelize.STRING(150), allowNull: true, after: "bank_account" });
    await queryInterface.sequelize.query(
      `UPDATE stores s JOIN storeBankAccounts b ON b.store_id = s.id AND b.sort = 0
          SET s.bank_name = b.bank_name, s.bank_account = b.account, s.bank_holder = b.holder`,
    );
    await queryInterface.dropTable("storeBankAccounts");
  },
};
