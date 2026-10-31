"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "categoryAttrs",
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        category_id: { type: Sequelize.INTEGER },
        attr_id: { type: Sequelize.INTEGER },
        order_number: { type: Sequelize.INTEGER, defaultValue: 0 },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
    await queryInterface.addIndex("categoryAttrs", ["category_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("categoryAttrs");
  },
};
