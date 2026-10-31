const { actionLogs } = require("../models");

module.exports.saveLog = async (data, t = null) => {
  try {
    await actionLogs.create(data, { transaction: t });
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};
