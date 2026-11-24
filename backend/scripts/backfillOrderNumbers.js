// order_number-гүй захиалгад (migration-ий дараа, шинэ код deploy-оос өмнө үүссэн) дугаар онооно:
//   node scripts/backfillOrderNumbers.js
const { orders, sequelize } = require("../models");
const { makeOrderNumber } = require("../helper/orderNumber");

(async () => {
  const rows = await orders.findAll({ where: { order_number: null } });
  for (const order of rows) {
    for (;;) {
      const number = makeOrderNumber(order.shop_id, order.created_at);
      if (await orders.count({ where: { order_number: number } })) continue;
      await order.update({ order_number: number });
      await sequelize.query("UPDATE notifications SET link = ? WHERE customer_id IS NOT NULL AND shop_id = ? AND link = ?", {
        replacements: [`/orders/${number}`, order.shop_id, `/orders/${order.id}`],
      });
      console.log(order.id, "→", number);
      break;
    }
  }
  console.log(`${rows.length} захиалга шинэчлэгдлээ`);
  await sequelize.close();
})();
