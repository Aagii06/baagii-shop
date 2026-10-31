const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class addressTypes extends Sequelize.Model {}

  addressTypes.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      code: { type: DataTypes.STRING },
      name: { type: DataTypes.STRING },
      // { bgColor, txtColor }
      style: { type: DataTypes.JSON },
      icon: { type: DataTypes.STRING },
      sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    { sequelize, tableName: "addressTypes", modelName: "addressTypes", timestamps: false },
  );

  return addressTypes;
};
