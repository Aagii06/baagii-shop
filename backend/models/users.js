const Sequelize = require("sequelize");
const { auditFields } = require("../utils/modelFields");

module.exports = (sequelize, DataTypes) => {
  class users extends Sequelize.Model {
    toJSON() {
      const values = Object.assign({}, this.get());
      delete values.password;
      return values;
    }
  }

  users.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      username: { type: DataTypes.STRING },
      password: { type: DataTypes.STRING },
      name: { type: DataTypes.STRING },
      phone: { type: DataTypes.STRING },
      email: { type: DataTypes.STRING },
      role: { type: DataTypes.STRING },
      ...auditFields(DataTypes),
    },
    { sequelize, tableName: "users", modelName: "users", timestamps: false },
  );

  users.softDelete = true;

  return users;
};
