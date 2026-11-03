"use strict";

// Хамтран ажиллах хүсэлтэд дэлгүүрийн мэдээлэл: батлахад эдгээрээр дэлгүүр (stores),
// SHOPPER хэрэглэгч (users) үүснэ.
const columns = (Sequelize) => ({
  store_name: { type: Sequelize.STRING, after: "phone" },
  name: { type: Sequelize.STRING, after: "store_name" },
  email: { type: Sequelize.STRING, after: "name" },
  address: { type: Sequelize.STRING(500), after: "email" },
  // Батлахад үүссэн дэлгүүр
  store_id: { type: Sequelize.INTEGER, after: "user_id" },
});

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    for (const [name, spec] of Object.entries(columns(Sequelize))) await queryInterface.addColumn("partnerRequests", name, spec);
  },

  async down(queryInterface, Sequelize) {
    for (const name of Object.keys(columns(Sequelize))) await queryInterface.removeColumn("partnerRequests", name);
  },
};
