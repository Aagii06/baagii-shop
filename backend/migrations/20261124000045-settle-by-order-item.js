"use strict";

// Тооцоог захиалгын мөрөөр хөтөлнө:
//  - orderItems.settled_qty — энэ мөрийн хэдэн ширхэгийн мөнгийг дэлгүүрт шилжүүлсэн.
//    Тооцоо хийгдээгүй = хүргэгдсэн захиалгын (qty − returned_qty − settled_qty) ширхэг.
//    Тооцооны дараа буцаалт гарвал энэ нь сөрөг болж, дараагийн тооцооноос хасагдана.
//  - storeSettlementItems — тооцоо бүрт ямар мөр, хэдэн ширхэг, ямар үнээр орсон.
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("orderItems", "settled_qty", { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0, after: "returned_qty" });
    await queryInterface.createTable(
      "storeSettlementItems",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        settlement_id: { type: Sequelize.INTEGER, allowNull: false },
        order_item_id: { type: Sequelize.INTEGER, allowNull: false },
        order_id: { type: Sequelize.INTEGER, allowNull: false },
        name: { type: Sequelize.STRING },
        // Сөрөг байж болно — тооцооны дараа буцаасан ширхэг
        qty: { type: Sequelize.INTEGER, allowNull: false },
        price: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("storeSettlementItems", ["settlement_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("storeSettlementItems");
    await queryInterface.removeColumn("orderItems", "settled_qty");
  },
};
