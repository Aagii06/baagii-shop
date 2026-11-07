"use strict";

// Хямдралын хугацаа (огноо багтаана). Хугацаа заагаагүй хямдрал үргэлж хүчинтэй;
// хугацаанаас гадуур бараа үндсэн үнээрээ (main_price) зарагдана (helper/productHelper.js).

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("products", "sale_start", { type: Sequelize.DATEONLY, allowNull: true, after: "price" });
    await queryInterface.addColumn("products", "sale_end", { type: Sequelize.DATEONLY, allowNull: true, after: "sale_start" });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("products", "sale_end");
    await queryInterface.removeColumn("products", "sale_start");
  },
};
