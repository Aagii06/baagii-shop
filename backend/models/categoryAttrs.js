const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class categoryAttrs extends Sequelize.Model {
    static associate({ attrs }) {
      this.belongsTo(attrs, { as: "attr", foreignKey: "attr_id" });
    }
  }

  categoryAttrs.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      category_id: { type: DataTypes.INTEGER },
      attr_id: { type: DataTypes.INTEGER },
      order_number: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    { sequelize, tableName: "categoryAttrs", modelName: "categoryAttrs", timestamps: false },
  );

  return categoryAttrs;
};
