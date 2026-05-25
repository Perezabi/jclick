const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  logger.error(`🚨 GLOBAL ERROR: ${err.stack || err}`);
  res.status(err.status || 500).json({ error: err.message || "Something went wrong!" });
};

module.exports = errorHandler;