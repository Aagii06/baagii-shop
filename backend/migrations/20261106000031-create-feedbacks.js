"use strict";

// "Бидэнд бичнэ үү" (вэбийн /contact) маягтаар ирсэн санал хүсэлт.
// Admin самбарын Профайл → Санал хүсэлт-ээс уншина.
// status: new -> read

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "feedbacks",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        shop_id: { type: Sequelize.INTEGER, allowNull: false },

        name: { type: Sequelize.STRING(100), allowNull: false },
        email: { type: Sequelize.STRING(150), allowNull: false },
        subject: { type: Sequelize.STRING(200), allowNull: false },
        message: { type: Sequelize.TEXT, allowNull: false },
        status: { type: Sequelize.STRING(10), allowNull: false, defaultValue: "new" },
        // Илгээгчийн IP (спам шалгахад)
        ip: { type: Sequelize.STRING(64) },

        read_by: { type: Sequelize.INTEGER },
        read_at: { type: Sequelize.STRING },
        created_at: { type: Sequelize.STRING },
        updated_at: { type: Sequelize.STRING },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("feedbacks", ["shop_id", "status"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("feedbacks");
  },
};
