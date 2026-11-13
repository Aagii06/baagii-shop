"use strict";

const moment = require("moment");

// Админ самбарын хэрэглэгч утасны дугаараа SMS кодоор баталгаажуулна (helper/phoneVerify.js).
// Одоо байгаа хэрэглэгчдэд 7 хоногийн хугацаа өгнө. Хамтран ажиллах хүсэлтээр (утсаа кодоор
// баталгаажуулж) үүссэн борлуулагчдыг баталгаажсан гэж тооцно.
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "phone_verified_at", { type: Sequelize.STRING, after: "role" });
    await queryInterface.addColumn("users", "phone_verify_deadline", { type: Sequelize.STRING, after: "phone_verified_at" });
    await queryInterface.sequelize.query(
      "UPDATE users u JOIN partnerRequests p ON p.user_id = u.id AND p.status = 'approved' SET u.phone_verified_at = p.decided_at WHERE u.phone = p.phone",
    );
    const deadline = moment().utcOffset("+0800").add(7, "days").format("YYYY-MM-DD HH:mm:ss");
    await queryInterface.sequelize.query("UPDATE users SET phone_verify_deadline = ? WHERE phone_verified_at IS NULL", {
      replacements: [deadline],
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("users", "phone_verify_deadline");
    await queryInterface.removeColumn("users", "phone_verified_at");
  },
};
