"use strict";

// Хэрэглэгч (ADMIN / SHOPPER) өөрийн профайлд оруулсан лого (файлын id)
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "logo", { type: Sequelize.STRING, after: "email" });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("users", "logo");
  },
};
