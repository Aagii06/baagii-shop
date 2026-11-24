const Sequelize = require("sequelize");

// Худалдагчид борлуулалтын мөнгө шилжүүлсэн тэмдэглэл (api/storeReport)
module.exports = (sequelize, DataTypes) => {
  class storeSettlements extends Sequelize.Model {}

  storeSettlements.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      shop_id: { type: DataTypes.INTEGER },
      store_id: { type: DataTypes.INTEGER },
      amount: { type: DataTypes.DECIMAL(14, 2) },
      note: { type: DataTypes.STRING(500) },
      created_by: { type: DataTypes.INTEGER },
      created_at: { type: DataTypes.STRING },
    },
    { sequelize, tableName: "storeSettlements", modelName: "storeSettlements", timestamps: false },
  );

  return storeSettlements;
};
