"use strict";

// orders.order_number — хэрэглэгчид харагдах таашгүй дугаар (helper/orderNumber.js).
// Хуучин захиалгуудад үүссэн өдрөөр нь дугаар оноож, худалдан авагчийн мэдэгдлийн
// /orders/<id> холбоосыг /orders/<order_number> болгоно (админы холбоос id-аараа үлдэнэ).
// Багана NULL зөвшөөрнө: шинэ код deploy хийгдэхээс өмнө хуучин кодоор үүссэн захиалга
// унахгүй (дугааргүй бол toWebOrder id-г харуулна; scripts/backfillOrderNumbers.js нөхнө).
const { makeOrderNumber } = require("../helper/orderNumber");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("orders", "order_number", { type: Sequelize.STRING(20), allowNull: true, after: "shop_id" });

    const [rows] = await queryInterface.sequelize.query("SELECT id, shop_id, created_at FROM orders WHERE order_number IS NULL");
    const used = new Set();
    for (const row of rows) {
      let number;
      do number = makeOrderNumber(row.shop_id, row.created_at);
      while (used.has(number));
      used.add(number);
      await queryInterface.sequelize.query("UPDATE orders SET order_number = ? WHERE id = ?", { replacements: [number, row.id] });
      await queryInterface.sequelize.query("UPDATE notifications SET link = ? WHERE customer_id IS NOT NULL AND shop_id = ? AND link = ?", {
        replacements: [`/orders/${number}`, row.shop_id, `/orders/${row.id}`],
      });
    }

    await queryInterface.addIndex("orders", ["order_number"], { unique: true, name: "orders_order_number_unique" });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "UPDATE notifications n JOIN orders o ON n.link = CONCAT('/orders/', o.order_number) AND n.shop_id = o.shop_id SET n.link = CONCAT('/orders/', o.id) WHERE n.customer_id IS NOT NULL",
    );
    await queryInterface.removeIndex("orders", "orders_order_number_unique");
    await queryInterface.removeColumn("orders", "order_number");
  },
};
