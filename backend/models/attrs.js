const Sequelize = require("sequelize");
const { auditFields } = require("../utils/modelFields");

module.exports = (sequelize, DataTypes) => {
  class attrs extends Sequelize.Model {
    static associate({ attrValues }) {
      this.hasMany(attrValues, { as: "attrValues", foreignKey: "attr_id" });
    }
  }

  attrs.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      shop_id: { type: DataTypes.INTEGER },
      code: { type: DataTypes.STRING },
      name: { type: DataTypes.STRING },
      short_name: { type: DataTypes.STRING },
      // text | number | date | boolean | select
      value_type: { type: DataTypes.STRING },
      description: { type: DataTypes.STRING },
      image: { type: DataTypes.STRING },
      ...auditFields(DataTypes),
    },
    { sequelize, tableName: "attrs", modelName: "attrs", timestamps: false },
  );

  attrs.softDelete = true;

  return attrs;
};
