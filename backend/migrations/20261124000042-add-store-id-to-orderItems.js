"use strict";

// orderItems.store_id — захиалах үеийн барааны дэлгүүр (худалдагч). Бараа дараа нь өөр
// дэлгүүрт шилжсэн ч захиалгын тооцоо, мэдэгдэл тухайн үеийн дэлгүүрээрээ үлдэнэ.
// NULL — үндсэн дэлгүүрийн өөрийн бараа. Хуучин мөрүүдийг барааных нь одоогийн дэлгүүрээр нөхнө.
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("orderItems", "store_id", { type: Sequelize.INTEGER, allowNull: true, after: "variant_id" });
    await queryInterface.sequelize.query(
      "UPDATE orderItems oi JOIN products p ON p.id = oi.product_id SET oi.store_id = p.store_id WHERE oi.store_id IS NULL",
    );
    await queryInterface.addIndex("orderItems", ["store_id"]);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("orderItems", ["store_id"]);
    await queryInterface.removeColumn("orderItems", "store_id");
  },
};
