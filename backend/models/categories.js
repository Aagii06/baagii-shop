const Sequelize = require("sequelize");
const { auditFields } = require("../utils/modelFields");

module.exports = (sequelize, DataTypes) => {
  class categories extends Sequelize.Model {
    static associate({ categories, categoryAttrs, products }) {
      this.belongsTo(categories, { as: "parent", foreignKey: "parent_id" });
      this.hasMany(categories, { as: "children", foreignKey: "parent_id" });
      this.hasMany(categoryAttrs, { as: "categoryAttrs", foreignKey: "category_id" });
      this.hasMany(products, { as: "products", foreignKey: "category_id" });
    }
  }

  categories.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      parent_id: { type: DataTypes.INTEGER },
      code: { type: DataTypes.STRING },
      name: { type: DataTypes.STRING },
      image: { type: DataTypes.STRING },
      // { borderColor, txtColor, bgColor, icon }
      style: { type: DataTypes.JSON },
      childs: { type: DataTypes.JSON },
      order_number: { type: DataTypes.INTEGER, defaultValue: 0 },
      ...auditFields(DataTypes),
    },
    { sequelize, tableName: "categories", modelName: "categories", timestamps: false },
  );

  categories.softDelete = true;

  return categories;
};
