const Sequelize = require("sequelize");
const { auditFields } = require("../utils/modelFields");

module.exports = (sequelize, DataTypes) => {
  class blogs extends Sequelize.Model {}

  // Дэлгүүрийн нийтлэл (Ajrug: "Ээжүүдийн булан")
  blogs.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      shop_id: { type: DataTypes.INTEGER },
      // Вэбийн холбоос (/blog/{slug}); гарчгаас үүсгэж, дараа нь өөрчлөхгүй
      slug: { type: DataTypes.STRING },
      title: { type: DataTypes.STRING },
      excerpt: { type: DataTypes.TEXT },
      // Ангилал: "Зөвлөгөө", "Арчилгаа", …
      tag: { type: DataTypes.STRING },
      author: { type: DataTypes.STRING },
      date: { type: DataTypes.STRING },
      read_minutes: { type: DataTypes.INTEGER },
      // Нүүр зургийн id (file/router.js) эсвэл холбоос
      image: { type: DataTypes.STRING },
      // Догол мөрүүд хоосон мөрөөр тусгаарлагдана
      body: { type: DataTypes.TEXT },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      ...auditFields(DataTypes),
    },
    { sequelize, tableName: "blogs", modelName: "blogs", timestamps: false },
  );

  blogs.softDelete = true;

  return blogs;
};
