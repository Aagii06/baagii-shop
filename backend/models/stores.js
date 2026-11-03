const Sequelize = require("sequelize");
const { auditFields } = require("../utils/modelFields");

module.exports = (sequelize, DataTypes) => {
  class stores extends Sequelize.Model {
    static associate({ products, users }) {
      this.hasMany(products, { as: "products", foreignKey: "store_id" });
      this.hasMany(users, { as: "users", foreignKey: "store_id" });
    }
  }

  // Борлуулагч дэлгүүр: SHOPPER хэрэглэгч, бараа нь store_id-аар холбогдоно
  stores.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      shop_id: { type: DataTypes.INTEGER },
      name: { type: DataTypes.STRING },
      phone: { type: DataTypes.STRING },
      email: { type: DataTypes.STRING },
      address: { type: DataTypes.STRING },
      logo: { type: DataTypes.STRING },
      ...auditFields(DataTypes),
    },
    { sequelize, tableName: "stores", modelName: "stores", timestamps: false },
  );

  stores.softDelete = true;

  return stores;
};
