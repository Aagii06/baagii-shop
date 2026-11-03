"use strict";

// Дэлгүүр доторх борлуулагч дэлгүүрүүд (stores): SHOPPER хэрэглэгч (users.store_id) аль
// дэлгүүрийнх, бараа (products.store_id) аль дэлгүүрийнх болохыг заана.
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "stores",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        shop_id: { type: Sequelize.INTEGER, allowNull: false },
        name: { type: Sequelize.STRING },
        phone: { type: Sequelize.STRING },
        email: { type: Sequelize.STRING },
        address: { type: Sequelize.STRING(500) },
        // Файлын нэр (file/router.js-ээр харуулна)
        logo: { type: Sequelize.STRING },
        status: { type: Sequelize.STRING, defaultValue: "active" },
        created_by: { type: Sequelize.INTEGER },
        updated_by: { type: Sequelize.INTEGER },
        deleted_by: { type: Sequelize.INTEGER },
        created_at: { type: Sequelize.STRING },
        updated_at: { type: Sequelize.STRING },
        deleted_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("stores", ["shop_id"]);
    for (const table of ["users", "products"]) {
      await queryInterface.addColumn(table, "store_id", { type: Sequelize.INTEGER, allowNull: true, after: "shop_id" });
      await queryInterface.addIndex(table, ["store_id"]);
    }
  },

  async down(queryInterface) {
    for (const table of ["users", "products"]) await queryInterface.removeColumn(table, "store_id");
    await queryInterface.dropTable("stores");
  },
};
