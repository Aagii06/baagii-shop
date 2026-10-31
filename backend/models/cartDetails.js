const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class cartDetails extends Sequelize.Model {
    static associate({ carts, productVariants }) {
      this.belongsTo(carts, { as: "cart", foreignKey: "cart_id" });
      this.belongsTo(productVariants, { as: "variant", foreignKey: "variant_id" });
    }
  }

  cartDetails.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      cart_id: { type: DataTypes.INTEGER },
      variant_id: { type: DataTypes.INTEGER },
      qty: { type: DataTypes.INTEGER, defaultValue: 0 },
      created_at: { type: DataTypes.STRING },
      updated_at: { type: DataTypes.STRING },
    },
    { sequelize, tableName: "cartDetails", modelName: "cartDetails", timestamps: false },
  );

  return cartDetails;
};
