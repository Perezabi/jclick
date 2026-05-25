const { validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return the first error message for a cleaner response
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

module.exports = validate;