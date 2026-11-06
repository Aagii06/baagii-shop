"use strict";

// 1-р дэлгүүрийн нэрийг "GOLDEN UVS" → "UVS SHOP" (имэйлийн илгээгч, SMS-ийн угтварт гардаг).

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkUpdate("shops", { name: "UVS SHOP" }, { id: 1 });
  },

  async down(queryInterface) {
    await queryInterface.bulkUpdate("shops", { name: "GOLDEN UVS" }, { id: 1 });
  },
};
