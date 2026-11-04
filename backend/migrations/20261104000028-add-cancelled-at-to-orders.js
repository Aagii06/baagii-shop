"use strict";

// Удаан төлөгдөөгүй захиалгыг ADMIN цуцалсан огноо (status = cancelled)
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("orders", "cancelled_at", { type: Sequelize.STRING, after: "returned_at" });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("orders", "cancelled_at");
  },
};
