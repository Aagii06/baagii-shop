const Sequelize = require("sequelize");

// "Бидэнд бичнэ үү" маягтаар ирсэн санал хүсэлт (migrations/20261106000031-create-feedbacks.js)
module.exports = (sequelize, DataTypes) => {
  class feedbacks extends Sequelize.Model {}

  feedbacks.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      shop_id: { type: DataTypes.INTEGER },
      name: { type: DataTypes.STRING },
      email: { type: DataTypes.STRING },
      phone: { type: DataTypes.STRING },
      // Заавал биш (AjrugShop-ын маягт гарчиг асуудаггүй)
      subject: { type: DataTypes.STRING },
      message: { type: DataTypes.TEXT },
      // new | read
      status: { type: DataTypes.STRING, defaultValue: "new" },
      ip: { type: DataTypes.STRING },
      read_by: { type: DataTypes.INTEGER },
      read_at: { type: DataTypes.STRING },
      created_at: { type: DataTypes.STRING },
      updated_at: { type: DataTypes.STRING },
    },
    { sequelize, tableName: "feedbacks", modelName: "feedbacks", timestamps: false },
  );

  return feedbacks;
};
