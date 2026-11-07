"use strict";

// Дэлгүүрийн түвшин: gold / silver / bronze / normal. Зөвхөн ADMIN тохируулна;
// вэб дээр Дэлгүүрүүд хуудсанд өндөр түвшнийх нь бараа эхэндээ гарна.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("stores", "tier", {
      type: Sequelize.STRING(16),
      allowNull: false,
      defaultValue: "normal",
      after: "logo",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("stores", "tier");
  },
};
