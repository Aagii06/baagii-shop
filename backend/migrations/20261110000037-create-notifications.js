"use strict";

// Админы толгойн 🔔 мэдэгдэл. Хүлээн авагч бүрт (users.id) нэг мөр — уншсан эсэх нь хүн бүрт тусдаа.
// type: order (шинэ захиалга), order_paid (QPay төлөгдсөн), partner (хамтран ажиллах хүсэлт),
//       feedback (санал хүсэлт), low_stock (үлдэгдэл дуусч байна).
// link: админ самбарын зам, жишээ нь "/orders/12" — дарахад тэр хуудас руу орно.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "notifications",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        shop_id: { type: Sequelize.INTEGER, allowNull: false },
        user_id: { type: Sequelize.INTEGER, allowNull: false },
        type: { type: Sequelize.STRING(20), allowNull: false },
        title: { type: Sequelize.STRING(200), allowNull: false },
        body: { type: Sequelize.STRING(500) },
        link: { type: Sequelize.STRING(200) },
        read_at: { type: Sequelize.STRING },
        created_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("notifications", ["shop_id", "user_id", "read_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("notifications");
  },
};
