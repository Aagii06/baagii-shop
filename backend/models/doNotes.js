const Sequelize = require("sequelize");
const { auditFields } = require("../utils/modelFields");

module.exports = (sequelize, DataTypes) => {
  class doNotes extends Sequelize.Model {

  }

  doNotes.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING },
      description: { type: DataTypes.STRING },
      ...auditFields(DataTypes),
    },
    { sequelize, tableName: "doNotes", modelName: "doNotes", timestamps: false },
  );

  return doNotes;
};
