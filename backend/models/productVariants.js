const Sequelize = require("sequelize");
const { auditFields } = require("../utils/modelFields");

module.exports = (sequelize, DataTypes) => {
  class productVariants extends Sequelize.Model {
    static associate({ products }) {
      this.belongsTo(products, { as: "product", foreignKey: "product_id" });
    }
  }

  productVariants.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      product_id: { type: DataTypes.INTEGER },
      code: { type: DataTypes.STRING },
      name: { type: DataTypes.STRING },
      main_price: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
      price: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
      // Бүртгэсэн тоо / зарагдаагүй үлдэгдэл (захиалгад хасагдаж, буцаалтад нэмэгдэнэ)
      qty: { type: DataTypes.INTEGER, defaultValue: 0 },
      remain: { type: DataTypes.INTEGER, defaultValue: 0 },
      // [{ attrId, attrName, value, color, image }]
      attr: { type: DataTypes.JSON },
      order_number: { type: DataTypes.INTEGER, defaultValue: 0 },
      ...auditFields(DataTypes),
    },
    { sequelize, tableName: "productVariants", modelName: "productVariants", timestamps: false },
  );

  return productVariants;
};
