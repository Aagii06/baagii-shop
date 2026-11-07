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
      // Эхний (үндсэн) утас / имэйл / хаяг; бүгд нь JSON массиваар phones / emails / addresses-д
      phone: { type: DataTypes.STRING },
      phones: { type: DataTypes.TEXT },
      email: { type: DataTypes.STRING },
      emails: { type: DataTypes.TEXT },
      address: { type: DataTypes.STRING },
      addresses: { type: DataTypes.TEXT },
      logo: { type: DataTypes.STRING },
      // gold / silver / bronze / normal (config/constants.js storeTiers); зөвхөн ADMIN тохируулна
      tier: { type: DataTypes.STRING, defaultValue: "normal" },
      ...auditFields(DataTypes),
    },
    { sequelize, tableName: "stores", modelName: "stores", timestamps: false },
  );

  stores.softDelete = true;

  // JSON жагсаалт; хуучин мөрөнд зөвхөн нэг утга байвал түүнийг
  stores.listOf = (row, listField, singleField) => {
    let list = [];
    try {
      list = JSON.parse(row?.[listField] || "[]");
    } catch {
      list = [];
    }
    if (!Array.isArray(list)) list = [];
    if (!list.length && row?.[singleField]) list = [row[singleField]];
    return list.map(String);
  };

  return stores;
};
