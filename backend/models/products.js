const Sequelize = require("sequelize");
const { auditFields } = require("../utils/modelFields");

module.exports = (sequelize, DataTypes) => {
  class products extends Sequelize.Model {
    static associate({ categories, productVariants }) {
      this.belongsTo(categories, { as: "category", foreignKey: "category_id" });
      this.hasMany(productVariants, { as: "variants", foreignKey: "product_id" });
    }
  }

  products.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      category_id: { type: DataTypes.INTEGER },
      date: { type: DataTypes.STRING },
      name: { type: DataTypes.STRING },
      title: { type: DataTypes.STRING },
      description: { type: DataTypes.TEXT },
      // Файлын нэрс (file/router.js-ээр харуулна)
      images: { type: DataTypes.JSON },
      // Барааны сонголтууд, утга бүрийн зурагтай нь (helper/productHelper.js)
      attrs: { type: DataTypes.JSON },
      qty: { type: DataTypes.INTEGER, defaultValue: 0 },
      main_price: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
      price: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      ...auditFields(DataTypes),
    },
    { sequelize, tableName: "products", modelName: "products", timestamps: false },
  );

  products.softDelete = true;

  return products;
};
