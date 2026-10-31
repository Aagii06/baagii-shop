"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Хүргэлтийн сонголт (config/constants.js shopSettings.delivery)
    await queryInterface.addColumn("orders", "delivery_method", { type: Sequelize.STRING, after: "note" });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("orders", "delivery_method");
  },
};
