const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class orderItems extends Sequelize.Model {
    static associate({ orders, products, stores }) {
      this.belongsTo(orders, { as: "order", foreignKey: "order_id" });
      this.belongsTo(products, { as: "product", foreignKey: "product_id" });
      // Захиалах үеийн дэлгүүр — барааны одоогийн дэлгүүрээс (product.store) өөр байж болно
      this.belongsTo(stores, { as: "store", foreignKey: "store_id" });
    }
  }

  orderItems.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      order_id: { type: DataTypes.INTEGER },
      product_id: { type: DataTypes.INTEGER },
      variant_id: { type: DataTypes.INTEGER },
      // Захиалах үеийн дэлгүүр (худалдагч); null — үндсэн дэлгүүрийн бараа
      store_id: { type: DataTypes.INTEGER },
      // Захиалах үеийн нэр, зураг, үнэ (бараа өөрчлөгдсөн ч хэвээр)
      name: { type: DataTypes.STRING },
      image: { type: DataTypes.STRING },
      qty: { type: DataTypes.INTEGER, defaultValue: 0 },
      price: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
      returned_qty: { type: DataTypes.INTEGER, defaultValue: 0 },
      // Дэлгүүрт мөнгийг нь шилжүүлсэн ширхэг (api/storeReport settle)
      settled_qty: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    { sequelize, tableName: "orderItems", modelName: "orderItems", timestamps: false },
  );

  return orderItems;
};
