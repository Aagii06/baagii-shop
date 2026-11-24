"use strict";

// storeSettlements — худалдагчид (дэлгүүрт) борлуулалтын мөнгийг шилжүүлсэн тэмдэглэл.
// Олгох үлдэгдэл = хүргэгдсэн захиалгын (буцаалтгүй) нийт дүн − шилжүүлсэн нийт дүн (api/storeReport).
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "storeSettlements",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        shop_id: { type: Sequelize.INTEGER, allowNull: false },
        store_id: { type: Sequelize.INTEGER, allowNull: false },
        amount: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
        note: { type: Sequelize.STRING(500) },
        created_by: { type: Sequelize.INTEGER },
        created_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("storeSettlements", ["shop_id", "store_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("storeSettlements");
  },
};
