const Sequelize = require("sequelize");
const { auditFields } = require("../utils/modelFields");

module.exports = (sequelize, DataTypes) => {
  class testimonials extends Sequelize.Model {}

  // Нүүр хуудасны "Эцэг эхчүүдийн сэтгэгдэл" (admin-аас бүртгэнэ)
  testimonials.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      shop_id: { type: DataTypes.INTEGER },
      quote: { type: DataTypes.TEXT },
      name: { type: DataTypes.STRING },
      // "4 настай охины ээж" гэх мэт
      role: { type: DataTypes.STRING },
      // 1–5 од
      rating: { type: DataTypes.INTEGER, defaultValue: 5 },
      // Бага нь эхэндээ
      sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      ...auditFields(DataTypes),
    },
    { sequelize, tableName: "testimonials", modelName: "testimonials", timestamps: false },
  );

  testimonials.softDelete = true;

  return testimonials;
};
