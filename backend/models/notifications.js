const Sequelize = require("sequelize");

// 🔔 мэдэгдэл — админы толгой ба худалдан авагчийн профайл (migrations/...037, ...039)
module.exports = (sequelize, DataTypes) => {
  class notifications extends Sequelize.Model {}

  notifications.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      shop_id: { type: DataTypes.INTEGER },
      // Хүлээн авагч: админ/худалдагч (user_id) эсвэл худалдан авагч (customer_id)
      user_id: { type: DataTypes.INTEGER },
      customer_id: { type: DataTypes.INTEGER },
      // Админд: order | order_paid | order_cancelled | order_returned | order_overdue | partner | feedback | low_stock
      // Худалдан авагчид: order_paid | order_confirmed | order_delivered | order_cancelled | order_returned |
      //                   partner_approved | partner_rejected
      type: { type: DataTypes.STRING },
      title: { type: DataTypes.STRING },
      body: { type: DataTypes.STRING },
      link: { type: DataTypes.STRING },
      read_at: { type: DataTypes.STRING },
      created_at: { type: DataTypes.STRING },
    },
    { sequelize, tableName: "notifications", modelName: "notifications", timestamps: false },
  );

  return notifications;
};
