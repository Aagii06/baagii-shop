const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class partnerRequests extends Sequelize.Model {}

  partnerRequests.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      shop_id: { type: DataTypes.INTEGER },
      phone: { type: DataTypes.STRING },
      // Хүсэлт гаргагчийн өгсөн дэлгүүрийн мэдээлэл (email, address заавал биш)
      store_name: { type: DataTypes.STRING },
      name: { type: DataTypes.STRING },
      email: { type: DataTypes.STRING },
      address: { type: DataTypes.STRING },
      // pending | approved | rejected
      status: { type: DataTypes.STRING, defaultValue: "pending" },
      // Батлахад үүссэн SHOPPER хэрэглэгч
      user_id: { type: DataTypes.INTEGER },
      // Батлахад үүссэн дэлгүүр
      store_id: { type: DataTypes.INTEGER },
      decided_by: { type: DataTypes.INTEGER },
      decided_at: { type: DataTypes.STRING },
      created_by: { type: DataTypes.INTEGER },
      created_at: { type: DataTypes.STRING },
      updated_at: { type: DataTypes.STRING },
    },
    { sequelize, tableName: "partnerRequests", modelName: "partnerRequests", timestamps: false },
  );

  return partnerRequests;
};
