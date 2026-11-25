"use strict";

// Дэлгүүрийн (худалдагчийн) данс — тооцоо шилжүүлэхэд админ хуулж авна (мөнгийг вебээс шилжүүлэхгүй)
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("stores", "bank_name", { type: Sequelize.STRING(100), allowNull: true, after: "logo" });
    await queryInterface.addColumn("stores", "bank_account", { type: Sequelize.STRING(50), allowNull: true, after: "bank_name" });
    await queryInterface.addColumn("stores", "bank_holder", { type: Sequelize.STRING(150), allowNull: true, after: "bank_account" });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("stores", "bank_holder");
    await queryInterface.removeColumn("stores", "bank_account");
    await queryInterface.removeColumn("stores", "bank_name");
  },
};
