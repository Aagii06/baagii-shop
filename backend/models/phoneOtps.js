const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class phoneOtps extends Sequelize.Model {}

  phoneOtps.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      phone: { type: DataTypes.STRING },
      purpose: { type: DataTypes.STRING },
      otp_hash: { type: DataTypes.STRING },
      expires_at: { type: DataTypes.STRING },
      sent_at: { type: DataTypes.STRING },
      attempts: { type: DataTypes.INTEGER, defaultValue: 0 },
      created_at: { type: DataTypes.STRING },
      updated_at: { type: DataTypes.STRING },
    },
    { sequelize, tableName: "phoneOtps", modelName: "phoneOtps", timestamps: false },
  );

  return phoneOtps;
};
