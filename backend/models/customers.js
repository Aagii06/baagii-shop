const Sequelize = require("sequelize");
const { auditFields } = require("../utils/modelFields");

module.exports = (sequelize, DataTypes) => {
  class customers extends Sequelize.Model {
    static associate({ orders }) {
      this.hasMany(orders, { as: "orders", foreignKey: "customer_id" });
    }
  }

  customers.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      phone: { type: DataTypes.STRING },
      name: { type: DataTypes.STRING },
      ...auditFields(DataTypes),
    },
    { sequelize, tableName: "customers", modelName: "customers", timestamps: false },
  );

  return customers;
};
