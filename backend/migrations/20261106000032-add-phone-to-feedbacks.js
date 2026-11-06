"use strict";

// AjrugShop-ын /contact маягт гарчгийн оронд утас асуудаг: phone нэмж, subject-ийг заавал биш болгоно.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("feedbacks", "phone", { type: Sequelize.STRING(20), after: "email" });
    await queryInterface.changeColumn("feedbacks", "subject", { type: Sequelize.STRING(200), allowNull: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("feedbacks", "phone");
    await queryInterface.changeColumn("feedbacks", "subject", { type: Sequelize.STRING(200), allowNull: false });
  },
};
