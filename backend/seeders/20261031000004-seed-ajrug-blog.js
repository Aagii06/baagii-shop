"use strict";

// Ajrug-ийн "Ээжүүдийн булан"-гийн анхны нийтлэлүүд (өмнө нь вэбийн src/data/blog.ts-д байсан).
// Зургийг seeders/data/blog-оос public/uploads/products руу хуулж, файлын id болгоно.
const fs = require("fs");
const path = require("path");
const { uploadPath, thumbName } = require("../helper/fileHelper");
const sharp = require("sharp");

const dataDir = path.join(__dirname, "data/blog");
const posts = require("./data/blog/ajrug-posts.json");
const at = "2026-10-31 00:00:00";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [[shop]] = await queryInterface.sequelize.query("SELECT id FROM shops WHERE code = 'ajrug'");
    if (!shop) return;

    await fs.promises.mkdir(uploadPath, { recursive: true });
    for (const post of posts) {
      const target = path.join(uploadPath, post.image);
      if (!fs.existsSync(target)) await fs.promises.copyFile(path.join(dataDir, post.image), target);
      const thumb = path.join(uploadPath, thumbName(post.image));
      if (!fs.existsSync(thumb)) await sharp(target).resize({ width: 400, withoutEnlargement: true }).toFile(thumb);
    }

    const [[{ cnt }]] = await queryInterface.sequelize.query("SELECT COUNT(*) AS cnt FROM blogs WHERE shop_id = ?", { replacements: [shop.id] });
    if (cnt > 0) return;
    await queryInterface.bulkInsert(
      "blogs",
      posts.map((p) => ({
        shop_id: shop.id,
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        tag: p.tag,
        author: p.author,
        date: p.date,
        read_minutes: p.readMinutes,
        image: p.image,
        body: p.body,
        is_active: true,
        status: "active",
        created_at: at,
      })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("blogs", { slug: posts.map((p) => p.slug) }, {});
  },
};
