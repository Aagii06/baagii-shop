module.exports.validate = (validations) => async (req, res, next) => {
  let errArr = [];
  for (let validation of validations) {
    if (validation) {
      const result = await validation.run(req);
      if (Array.isArray(result.errors) && result.errors.length > 0) errArr.push(result.errors[0]);
    }
  }
  if (errArr.length === 0) return next();

  // Фронт `message`-ийг шууд харуулна — эхний алдааг тэнд тавина
  const errors = errArr.map((err) => ({ field: err.param, message: err.msg }));
  return res.status(200).json({ success: false, type: "validation", message: errors[0].message, errors });
};
