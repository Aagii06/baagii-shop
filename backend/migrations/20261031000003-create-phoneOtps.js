"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "phoneOtps",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        phone: { type: Sequelize.STRING },
        purpose: { type: Sequelize.STRING },
        otp_hash: { type: Sequelize.STRING },
        expires_at: { type: Sequelize.STRING },
        sent_at: { type: Sequelize.STRING },
        attempts: { type: Sequelize.INTEGER, defaultValue: 0 },
        created_at: { type: Sequelize.STRING },
        updated_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("phoneOtps", ["phone","purpose"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("phoneOtps");
  },
};
