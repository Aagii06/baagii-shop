"use strict";

// Дэлгүүр бүрийн анхны админ (утасны дугаараар нэвтэрнэ). Нууц үгийг кодонд бичихгүй —
// .env-ээс: ADMIN_PHONE=99999999 ADMIN_PASSWORD=... npm run seed
require("../config/env");
const bcrypt = require("bcryptjs");
const { roles } = require("../config/constants");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const { ADMIN_PHONE, ADMIN_PASSWORD } = process.env;
    if (!ADMIN_PHONE || !ADMIN_PASSWORD) {
      console.log("ADMIN_PHONE / ADMIN_PASSWORD тохируулаагүй тул админ үүсгэсэнгүй");
      return;
    }
    const [shops] = await queryInterface.sequelize.query("SELECT id, code FROM shops");
    for (const shop of shops) {
      const [existing] = await queryInterface.sequelize.query(
        "SELECT id FROM users WHERE shop_id = ? AND phone = ? AND status = 'active' LIMIT 1",
        { replacements: [shop.id, ADMIN_PHONE] },
      );
      if (existing.length) {
        console.log(`${shop.code}: ${ADMIN_PHONE} дугаартай хэрэглэгч бүртгэлтэй тул алгаслаа`);
        continue;
      }
      const password = await bcrypt.hash(ADMIN_PASSWORD, await bcrypt.genSalt(8));
      await queryInterface.bulkInsert("users", [
        { shop_id: shop.id, username: ADMIN_PHONE, phone: ADMIN_PHONE, name: "Админ", password, role: roles.admin, status: "active", created_at: "2026-10-31 00:00:00" },
      ]);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("users", { role: roles.admin }, {});
  },
};
