const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class locations extends Sequelize.Model {

  }

  locations.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      // Аймаг/Нийслэл → Сум/Дүүрэг → Баг/Хороо
      parent_id: { type: DataTypes.INTEGER },
      // city | district | subDistrict
      level: { type: DataTypes.STRING },
      code: { type: DataTypes.STRING },
      name: { type: DataTypes.STRING },
      sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    { sequelize, tableName: "locations", modelName: "locations", timestamps: false },
  );

  return locations;
};
