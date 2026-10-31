const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class actionLogs extends Sequelize.Model {

  }

  actionLogs.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      object_name: { type: DataTypes.STRING },
      object_id: { type: DataTypes.INTEGER },
      log_action: { type: DataTypes.STRING },
      modify_data: { type: DataTypes.TEXT },
      created_by: { type: DataTypes.INTEGER },
      created_at: { type: DataTypes.STRING },
    },
    { sequelize, tableName: "actionLogs", modelName: "actionLogs", timestamps: false },
  );

  return actionLogs;
};
