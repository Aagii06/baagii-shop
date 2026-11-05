"use strict";

// Илгээх SMS-ийн дараалал (helper/smsHelper.js). Android утсан дээрх SMS gateway app
// (sms_gateway_app) /api/sms-gateway-аас татаж өөрийн SIM-ээр илгээнэ.
// status: pending -> sending -> sent / failed

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "sms_outbox",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

        phonenumber: { type: Sequelize.STRING(20), allowNull: false },
        text: { type: Sequelize.STRING(500), allowNull: false },
        status: { type: Sequelize.STRING(10), allowNull: false, defaultValue: "pending" },
        // Утас руу хэдэн удаа өгсөн (утас унтарвал "sending"-ээс дахин өгнө)
        attempts: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        error: { type: Sequelize.STRING },
        sent_at: { type: Sequelize.STRING },

        created_at: { type: Sequelize.STRING },
        updated_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("sms_outbox", ["status", "created_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("sms_outbox");
  },
};
