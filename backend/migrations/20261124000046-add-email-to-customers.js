"use strict";

// Худалдан авагч профайлдаа имэйл нэмнэ (имэйлд ирсэн кодоор баталгаажуулна)
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("customers", "email", { type: Sequelize.STRING, allowNull: true, after: "name" });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("customers", "email");
  },
};
