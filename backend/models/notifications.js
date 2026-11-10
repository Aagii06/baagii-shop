const Sequelize = require("sequelize");

// Админы толгойн 🔔 мэдэгдэл (migrations/20261110000037-create-notifications.js)
module.exports = (sequelize, DataTypes) => {
  class notifications extends Sequelize.Model {}

  notifications.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      shop_id: { type: DataTypes.INTEGER },
      user_id: { type: DataTypes.INTEGER },
      // order | order_paid | partner | feedback | low_stock
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
