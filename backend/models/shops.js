const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class shops extends Sequelize.Model {}

  // Нэг backend олон дэлгүүрт үйлчилнэ. Frontend бүр өөрийн id-г X-Shop-Id толгойд илгээнэ
  // (admin/web .env: NEXT_PUBLIC_SHOP_ID), бүх өгөгдөл shop_id-аар тусгаарлагдана.
  shops.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      code: { type: DataTypes.STRING },
      name: { type: DataTypes.STRING },
      status: { type: DataTypes.STRING, defaultValue: "active" },
      created_at: { type: DataTypes.STRING },
    },
    { sequelize, tableName: "shops", modelName: "shops", timestamps: false },
  );

  return shops;
};
