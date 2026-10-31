"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "carts",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        // Зочны токены guestId, утсаар нэвтэрсэн бол customer_id
        guest_id: { type: Sequelize.STRING },
        customer_id: { type: Sequelize.INTEGER },
        // active | ordered | deleted
        status: { type: Sequelize.STRING, defaultValue: "active" },
        created_at: { type: Sequelize.STRING },
        updated_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("carts", ["guest_id"]);
    await queryInterface.addIndex("carts", ["customer_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("carts");
  },
};
