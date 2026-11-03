"use strict";

const { insertLocations } = require("./data/adminUnits");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [rows] = await queryInterface.sequelize.query("SELECT COUNT(*) AS cnt FROM locations");
    if (rows[0].cnt > 0) return;

    await insertLocations(queryInterface);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("locations", {}, {});
  },
};
