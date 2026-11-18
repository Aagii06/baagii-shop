"use strict";

// 1. notifications — худалдан авагчид ч мэдэгдэл очно: хүлээн авагч нь user_id (админ/худалдагч)
//    эсвэл customer_id (утсаар нэвтэрсэн худалдан авагч) хоёрын аль нэг.
// 2. orders.overdue_notified_at — удаан төлөгдөөгүй захиалгын сануулгыг нэг л удаа илгээнэ.
// 3. deviceTokens — апп-ын push (Firebase Cloud Messaging) токен. owner_type нь
//    "user" (апп-ын админ хэсэг) эсвэл "customer" (апп-ын дэлгүүр хэсэг); нэг утас хоёуланд нь
//    бүртгэгдэж болно.
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("notifications", "user_id", { type: Sequelize.INTEGER, allowNull: true });
    await queryInterface.addColumn("notifications", "customer_id", { type: Sequelize.INTEGER, after: "user_id" });
    await queryInterface.addIndex("notifications", ["shop_id", "customer_id", "read_at"]);

    await queryInterface.addColumn("orders", "overdue_notified_at", { type: Sequelize.STRING });

    await queryInterface.createTable(
      "deviceTokens",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        shop_id: { type: Sequelize.INTEGER, allowNull: false },
        owner_type: { type: Sequelize.STRING(10), allowNull: false },
        owner_id: { type: Sequelize.INTEGER, allowNull: false },
        token: { type: Sequelize.STRING(255), allowNull: false },
        platform: { type: Sequelize.STRING(10) },
        created_at: { type: Sequelize.STRING },
        updated_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("deviceTokens", ["token", "owner_type"], { unique: true });
    await queryInterface.addIndex("deviceTokens", ["shop_id", "owner_type", "owner_id"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("deviceTokens");
    await queryInterface.removeColumn("orders", "overdue_notified_at");
    await queryInterface.removeIndex("notifications", ["shop_id", "customer_id", "read_at"]);
    await queryInterface.removeColumn("notifications", "customer_id");
    await queryInterface.changeColumn("notifications", "user_id", { type: Sequelize.INTEGER, allowNull: false });
  },
};
