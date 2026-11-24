const Sequelize = require("sequelize");

// Тооцоонд орсон захиалгын мөрүүд (api/storeReport settle)
module.exports = (sequelize, DataTypes) => {
  class storeSettlementItems extends Sequelize.Model {}

  storeSettlementItems.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      settlement_id: { type: DataTypes.INTEGER },
      order_item_id: { type: DataTypes.INTEGER },
      order_id: { type: DataTypes.INTEGER },
      name: { type: DataTypes.STRING },
      qty: { type: DataTypes.INTEGER },
      price: { type: DataTypes.DECIMAL(14, 2) },
    },
    { sequelize, tableName: "storeSettlementItems", modelName: "storeSettlementItems", timestamps: false },
  );

  return storeSettlementItems;
};
