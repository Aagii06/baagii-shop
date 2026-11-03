"use strict";

const { insertLocations } = require("../seeders/data/adminUnits");

// Байршлыг ҮСХ-ны бүрэн жагсаалтаар (22 аймаг/нийслэл, 343 сум/дүүрэг, 1853 баг/хороо) солино.
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete("locations", {}, { transaction });
      await insertLocations(queryInterface, transaction);
    });
  },

  async down() {},
};
