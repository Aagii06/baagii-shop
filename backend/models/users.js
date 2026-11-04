const Sequelize = require("sequelize");
const { auditFields } = require("../utils/modelFields");

module.exports = (sequelize, DataTypes) => {
  class users extends Sequelize.Model {
    static associate({ stores }) {
      this.belongsTo(stores, { as: "store", foreignKey: "store_id" });
    }

    toJSON() {
      const values = Object.assign({}, this.get());
      delete values.password;
      return values;
    }
  }

  users.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      shop_id: { type: DataTypes.INTEGER },
      // SHOPPER-ийн дэлгүүр (stores); ADMIN-д null
      store_id: { type: DataTypes.INTEGER },
      username: { type: DataTypes.STRING },
      password: { type: DataTypes.STRING },
      name: { type: DataTypes.STRING },
      phone: { type: DataTypes.STRING },
      email: { type: DataTypes.STRING },
      // Профайлын лого (файлын id)
      logo: { type: DataTypes.STRING },
      role: { type: DataTypes.STRING },
      ...auditFields(DataTypes),
    },
    { sequelize, tableName: "users", modelName: "users", timestamps: false },
  );

  users.softDelete = true;

  return users;
};
