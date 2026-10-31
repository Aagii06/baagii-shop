const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class carts extends Sequelize.Model {
    static associate({ cartDetails }) {
      this.hasMany(cartDetails, { as: "cartDetails", foreignKey: "cart_id" });
    }
  }

  carts.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      // Зочны токены guestId, утсаар нэвтэрсэн бол customer_id
      guest_id: { type: DataTypes.STRING },
      customer_id: { type: DataTypes.INTEGER },
      // active | ordered | deleted
      status: { type: DataTypes.STRING, defaultValue: "active" },
      created_at: { type: DataTypes.STRING },
      updated_at: { type: DataTypes.STRING },
    },
    { sequelize, tableName: "carts", modelName: "carts", timestamps: false },
  );

  return carts;
};
