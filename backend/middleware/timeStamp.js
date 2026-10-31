const moment = require("moment");

module.exports.byAndAt = async (req, res, next) => {
  req.body.by = req.loggedUser?.id;
  req.body.at = moment().utcOffset("+0800").format("YYYY-MM-DD HH:mm:ss");
  return next();
};
