"use strict";

// Анхны админ. Нууц үгийг кодонд бичихгүй — .env-ээс: ADMIN_USERNAME=admin ADMIN_PASSWORD=... npm run seed
require("../config/env");
const bcrypt = require("bcryptjs");
const { roles } = require("../config/constants");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const { ADMIN_USERNAME = "admin", ADMIN_PASSWORD } = process.env;
    if (!ADMIN_PASSWORD) {
      console.log("ADMIN_PASSWORD тохируулаагүй тул админ үүсгэсэнгүй");
      return;
    }
    const [existing] = await queryInterface.sequelize.query("SELECT id FROM users WHERE username = ? AND status = 'active' LIMIT 1", {
      replacements: [ADMIN_USERNAME],
    });
    if (existing.length) return console.log(`${ADMIN_USERNAME} хэрэглэгч бүртгэлтэй тул алгаслаа`);

    const password = await bcrypt.hash(ADMIN_PASSWORD, await bcrypt.genSalt(8));
    await queryInterface.bulkInsert("users", [
      { username: ADMIN_USERNAME, name: "Админ", password, role: roles.admin, status: "active", created_at: "2026-10-31 00:00:00" },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("users", { role: roles.admin }, {});
  },
};
