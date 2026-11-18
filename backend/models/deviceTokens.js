const Sequelize = require("sequelize");

// Апп-ын push токен (migrations/20261118000039-customer-notifications-and-push.js)
module.exports = (sequelize, DataTypes) => {
  class deviceTokens extends Sequelize.Model {}

  deviceTokens.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      shop_id: { type: DataTypes.INTEGER },
      // user (админ/худалдагч) | customer (худалдан авагч)
      owner_type: { type: DataTypes.STRING },
      owner_id: { type: DataTypes.INTEGER },
      token: { type: DataTypes.STRING },
      // android | ios
      platform: { type: DataTypes.STRING },
      created_at: { type: DataTypes.STRING },
      updated_at: { type: DataTypes.STRING },
    },
    { sequelize, tableName: "deviceTokens", modelName: "deviceTokens", timestamps: false },
  );

  return deviceTokens;
};
