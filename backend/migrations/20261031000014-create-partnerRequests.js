"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "partnerRequests",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        phone: { type: Sequelize.STRING },
        // pending | approved | rejected
        status: { type: Sequelize.STRING, defaultValue: "pending" },
        // Батлахад үүссэн SHOPPER хэрэглэгч
        user_id: { type: Sequelize.INTEGER },
        decided_by: { type: Sequelize.INTEGER },
        decided_at: { type: Sequelize.STRING },
        created_by: { type: Sequelize.INTEGER },
        created_at: { type: Sequelize.STRING },
        updated_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("partnerRequests", ["phone"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("partnerRequests");
  },
};
