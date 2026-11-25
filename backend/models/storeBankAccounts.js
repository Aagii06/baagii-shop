const Sequelize = require("sequelize");

// Дэлгүүрийн (худалдагчийн) тооцоо шилжүүлэх данснууд — админ хуулж аваад банкны апп-аар шилжүүлнэ.
// sort 0 нь үндсэн данс. Хадгалахад бүгдийг нь сольж бичнэ (api/store).
module.exports = (sequelize, DataTypes) => {
  class storeBankAccounts extends Sequelize.Model {}

  storeBankAccounts.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      shop_id: { type: DataTypes.INTEGER },
      store_id: { type: DataTypes.INTEGER },
      bank_name: { type: DataTypes.STRING },
      account: { type: DataTypes.STRING },
      holder: { type: DataTypes.STRING },
      sort: { type: DataTypes.INTEGER },
    },
    { sequelize, tableName: "storeBankAccounts", modelName: "storeBankAccounts", timestamps: false },
  );

  return storeBankAccounts;
};
