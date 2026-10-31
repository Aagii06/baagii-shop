// Хүснэгт бүрийн нийтлэг баганууд (models/*, migrations/*). Огноо нь
// "YYYY-MM-DD HH:mm:ss" (+08:00) мөр — middleware/timeStamp.js-ийн byAndAt.
module.exports.auditFields = (DataTypes) => ({
  status: { type: DataTypes.STRING, defaultValue: "active" },
  created_by: { type: DataTypes.INTEGER },
  updated_by: { type: DataTypes.INTEGER },
  deleted_by: { type: DataTypes.INTEGER },
  created_at: { type: DataTypes.STRING },
  updated_at: { type: DataTypes.STRING },
  deleted_at: { type: DataTypes.STRING },
});
