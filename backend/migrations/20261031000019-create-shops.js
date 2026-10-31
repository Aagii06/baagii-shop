"use strict";

// Олон дэлгүүр: shops хүснэгт, дэлгүүрийн өгөгдөлтэй хүснэгт бүрт shop_id.
// Өмнө нь байсан мөрүүд (UVS) 1-р дэлгүүрт оногдоно.
const tables = [
  "users", "customers", "phoneOtps", "attrs", "categories", "products",
  "carts", "orders", "partnerRequests", "doNotes", "actionLogs",
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "shops",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        code: { type: Sequelize.STRING },
        name: { type: Sequelize.STRING },
        status: { type: Sequelize.STRING, defaultValue: "active" },
        created_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.bulkInsert("shops", [
      { id: 1, code: "uvs", name: "GOLDEN UVS", status: "active", created_at: "2026-10-31 00:00:00" },
      { id: 2, code: "ajrug", name: "Ajrug", status: "active", created_at: "2026-10-31 00:00:00" },
    ]);
    for (const table of tables) {
      await queryInterface.addColumn(table, "shop_id", { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1, after: "id" });
      await queryInterface.addIndex(table, ["shop_id"]);
    }
  },

  async down(queryInterface) {
    for (const table of tables) await queryInterface.removeColumn(table, "shop_id");
    await queryInterface.dropTable("shops");
  },
};
