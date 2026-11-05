const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class smsOutbox extends Sequelize.Model {}

  smsOutbox.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      phonenumber: { type: DataTypes.STRING(20) },
      text: { type: DataTypes.STRING(500) },
      status: { type: DataTypes.STRING(10) },
      attempts: { type: DataTypes.INTEGER },
      error: { type: DataTypes.STRING },
      sent_at: { type: DataTypes.STRING },

      created_at: { type: DataTypes.STRING },
      updated_at: { type: DataTypes.STRING },
    },
    {
      sequelize,
      tableName: "sms_outbox",
      modelName: "smsOutbox",
      timestamps: false,
    },
  );

  return smsOutbox;
};
