const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class orders extends Sequelize.Model {
    static associate({ orderItems, customers }) {
      this.hasMany(orderItems, { as: "items", foreignKey: "order_id" });
      this.belongsTo(customers, { as: "customer", foreignKey: "customer_id" });
    }
  }

  orders.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      customer_id: { type: DataTypes.INTEGER },
      // web | admin
      source: { type: DataTypes.STRING },
      // pending | confirmed | delivered | returned (config/constants.js)
      status: { type: DataTypes.STRING, defaultValue: "pending" },
      customer_name: { type: DataTypes.STRING },
      phone: { type: DataTypes.STRING },
      extra_phone: { type: DataTypes.STRING },
      email: { type: DataTypes.STRING },
      address: { type: DataTypes.STRING(1000) },
      address_label: { type: DataTypes.STRING },
      address_type_id: { type: DataTypes.INTEGER },
      city_id: { type: DataTypes.INTEGER },
      district_id: { type: DataTypes.INTEGER },
      sub_district_id: { type: DataTypes.INTEGER },
      note: { type: DataTypes.STRING(1000) },
      subtotal: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
      delivery_fee: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
      coupon_code: { type: DataTypes.STRING },
      coupon_amount: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
      payment_method: { type: DataTypes.STRING },
      paid_at: { type: DataTypes.STRING },
      confirmed_at: { type: DataTypes.STRING },
      delivered_at: { type: DataTypes.STRING },
      returned_at: { type: DataTypes.STRING },
      created_by: { type: DataTypes.INTEGER },
      updated_by: { type: DataTypes.INTEGER },
      created_at: { type: DataTypes.STRING },
      updated_at: { type: DataTypes.STRING },
    },
    { sequelize, tableName: "orders", modelName: "orders", timestamps: false },
  );

  return orders;
};
