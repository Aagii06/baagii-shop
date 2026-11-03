"use strict";

// Дэлгүүр 5 хүртэл утас, имэйл, хаягтай (JSON массив). phone / email / address нь эхний (үндсэн)-ийг хадгална.
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    for (const [list, single] of [["phones", "phone"], ["emails", "email"], ["addresses", "address"]]) {
      await queryInterface.addColumn("stores", list, { type: Sequelize.TEXT, allowNull: true, after: single });
      await queryInterface.sequelize.query(
        `UPDATE stores SET ${list} = JSON_ARRAY(${single}) WHERE ${single} IS NOT NULL AND ${single} <> ''`,
      );
    }
  },

  async down(queryInterface) {
    for (const list of ["phones", "emails", "addresses"]) await queryInterface.removeColumn("stores", list);
  },
};
