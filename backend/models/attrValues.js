const Sequelize = require("sequelize");
const { auditFields } = require("../utils/modelFields");

module.exports = (sequelize, DataTypes) => {
  class attrValues extends Sequelize.Model {
    static associate({ attrs }) {
      this.belongsTo(attrs, { as: "attr", foreignKey: "attr_id" });
    }
  }

  attrValues.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      attr_id: { type: DataTypes.INTEGER },
      code: { type: DataTypes.STRING },
      name: { type: DataTypes.STRING },
      name_eng: { type: DataTypes.STRING },
      description: { type: DataTypes.STRING },
      order_number: { type: DataTypes.INTEGER, defaultValue: 0 },
      image: { type: DataTypes.STRING },
      // Өнгөний дугуйн hex (#000000)
      color: { type: DataTypes.STRING },
      ...auditFields(DataTypes),
    },
    { sequelize, tableName: "attrValues", modelName: "attrValues", timestamps: false },
  );

  return attrValues;
};
