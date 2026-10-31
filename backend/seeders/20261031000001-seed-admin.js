"use strict";

// Дэлгүүр бүрийн анхны админ (утасны дугаараар нэвтэрнэ). Нууц үгийг кодонд бичихгүй —
// .env-ээс: ADMIN_PHONE_<КОД>=99999999 (жишээ нь ADMIN_PHONE_UVS), байхгүй бол ADMIN_PHONE; ADMIN_PASSWORD=... npm run seed
require("../config/env");
const bcrypt = require("bcryptjs");
const { roles } = require("../config/constants");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const { ADMIN_PHONE, ADMIN_PASSWORD } = process.env;
    if (!ADMIN_PASSWORD) {
      console.log("ADMIN_PASSWORD тохируулаагүй тул админ үүсгэсэнгүй");
      return;
    }
    const [shops] = await queryInterface.sequelize.query("SELECT id, code FROM shops");
    for (const shop of shops) {
      const phone = process.env[`ADMIN_PHONE_${shop.code.toUpperCase()}`] || ADMIN_PHONE;
      if (!phone) {
        console.log(`${shop.code}: ADMIN_PHONE_${shop.code.toUpperCase()} тохируулаагүй тул алгаслаа`);
        continue;
      }
      const [existing] = await queryInterface.sequelize.query(
        "SELECT id FROM users WHERE shop_id = ? AND phone = ? AND status = 'active' LIMIT 1",
        { replacements: [shop.id, phone] },
      );
      if (existing.length) {
        console.log(`${shop.code}: ${phone} дугаартай хэрэглэгч бүртгэлтэй тул алгаслаа`);
        continue;
      }
      const password = await bcrypt.hash(ADMIN_PASSWORD, await bcrypt.genSalt(8));
      await queryInterface.bulkInsert("users", [
        { shop_id: shop.id, username: phone, phone, name: "Админ", password, role: roles.admin, status: "active", created_at: "2026-10-31 00:00:00" },
      ]);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("users", { role: roles.admin }, {});
  },
};
