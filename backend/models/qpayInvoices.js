const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class qpayInvoices extends Sequelize.Model {}

  // Захиалгын QPay нэхэмжлэх. Төлөгдсөн эсэхийг QPay-ийн payment/check-ээр шалгана
  qpayInvoices.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      shop_id: { type: DataTypes.INTEGER },
      order_id: { type: DataTypes.INTEGER },
      sender_invoice_no: { type: DataTypes.STRING },
      invoice_id: { type: DataTypes.STRING },
      amount: { type: DataTypes.DECIMAL(14, 2) },
      status: { type: DataTypes.STRING, defaultValue: "pending" },
      qr_text: { type: DataTypes.TEXT },
      qr_image: { type: DataTypes.TEXT("medium") },
      short_url: { type: DataTypes.STRING },
      urls: { type: DataTypes.TEXT },
      payment_id: { type: DataTypes.STRING },
      paid_at: { type: DataTypes.STRING },
      created_at: { type: DataTypes.STRING },
      updated_at: { type: DataTypes.STRING },
    },
    { sequelize, tableName: "qpayInvoices", modelName: "qpayInvoices", timestamps: false },
  );

  return qpayInvoices;
};
