"use strict";

// Ajrug (shops.id = 2) нэг л дэлгүүртэй: "Ajrug". Бүх бараа, захиалгын мөр нь тэр дэлгүүрт.
// Shop 2-т дэлгүүр аль хэдийн байвал юу ч хийхгүй (дахин ажиллуулахад аюулгүй).
// Цаашид ганц дэлгүүртэй shop-д админ дэлгүүр сонгоогүй бол тэр дэлгүүрт автоматаар орно (api/product).
const SHOP_ID = 2;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const q = queryInterface.sequelize;
    const [[{ count }]] = await q.query("SELECT COUNT(*) AS count FROM stores WHERE shop_id = ?", { replacements: [SHOP_ID] });
    if (Number(count) > 0) return;
    const [[shop]] = await q.query("SELECT name FROM shops WHERE id = ?", { replacements: [SHOP_ID] });
    if (!shop) return;
    const at = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 19).replace("T", " ");
    const [storeId] = await q.query(
      "INSERT INTO stores (shop_id, name, phones, emails, addresses, tier, status, created_at) VALUES (?, ?, '[]', '[]', '[]', 'normal', 'active', ?)",
      { replacements: [SHOP_ID, shop.name, at] },
    );
    await q.query("UPDATE products SET store_id = ? WHERE shop_id = ? AND store_id IS NULL", { replacements: [storeId, SHOP_ID] });
    await q.query(
      "UPDATE orderItems oi JOIN orders o ON o.id = oi.order_id SET oi.store_id = ? WHERE o.shop_id = ? AND oi.store_id IS NULL",
      { replacements: [storeId, SHOP_ID] },
    );
  },

  // Өгөгдлийн migration — буцаахдаа барааг дэлгүүргүй болгож, дэлгүүрийг устгана
  async down(queryInterface) {
    const q = queryInterface.sequelize;
    const [rows] = await q.query("SELECT id FROM stores WHERE shop_id = ? AND name = (SELECT name FROM shops WHERE id = ?)", {
      replacements: [SHOP_ID, SHOP_ID],
    });
    for (const { id } of rows) {
      await q.query("UPDATE products SET store_id = NULL WHERE store_id = ?", { replacements: [id] });
      await q.query("UPDATE orderItems SET store_id = NULL WHERE store_id = ?", { replacements: [id] });
      await q.query("DELETE FROM stores WHERE id = ?", { replacements: [id] });
    }
  },
};
