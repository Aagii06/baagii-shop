const Sequelize = require("sequelize");

// Дэлгүүрийн "Дансаар төлөх" данснууд (api/paymentSetting). sort 0 нь үндсэн данс;
// хадгалахад бүгдийг нь сольж бичнэ. Эхнийх нь paymentSettings.bank_*-д бас тусгагдана.
module.exports = (sequelize, DataTypes) => {
  class shopBankAccounts extends Sequelize.Model {}

  shopBankAccounts.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      shop_id: { type: DataTypes.INTEGER },
      bank_name: { type: DataTypes.STRING },
      account_number: { type: DataTypes.STRING },
      account_name: { type: DataTypes.STRING },
      iban: { type: DataTypes.STRING },
      sort: { type: DataTypes.INTEGER },
    },
    { sequelize, tableName: "shopBankAccounts", modelName: "shopBankAccounts", timestamps: false },
  );

  return shopBankAccounts;
};
