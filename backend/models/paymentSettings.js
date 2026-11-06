const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class paymentSettings extends Sequelize.Model {}

  // Дэлгүүр бүрт нэг мөр: дансаар шилжүүлэх ба QPay-ийн тохиргоо
  paymentSettings.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      shop_id: { type: DataTypes.INTEGER },
      bank_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
      bank_name: { type: DataTypes.STRING },
      bank_account_name: { type: DataTypes.STRING },
      bank_account_number: { type: DataTypes.STRING },
      bank_iban: { type: DataTypes.STRING },
      qpay_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
      qpay_sandbox: { type: DataTypes.BOOLEAN, defaultValue: true },
      qpay_username: { type: DataTypes.STRING },
      qpay_password: { type: DataTypes.STRING },
      qpay_invoice_code: { type: DataTypes.STRING },
      // Admin-аас захиалга үүсгэхэд хүргэлтийн төлбөр авах эсэх, анхдагч үнэ
      delivery_enabled: { type: DataTypes.BOOLEAN, defaultValue: true },
      delivery_fee: { type: DataTypes.DECIMAL(14, 2), defaultValue: 6000 },
      updated_by: { type: DataTypes.INTEGER },
      created_at: { type: DataTypes.STRING },
      updated_at: { type: DataTypes.STRING },
    },
    { sequelize, tableName: "paymentSettings", modelName: "paymentSettings", timestamps: false },
  );

  return paymentSettings;
};
