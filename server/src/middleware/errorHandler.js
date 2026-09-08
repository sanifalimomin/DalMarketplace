function errorHandler(err, req, res, next) {
  const status = err.status || 500;

  if (status >= 500) console.error(err);

  const body = { error: status >= 500 ? 'Internal server error' : err.message };
  if (err.details) body.details = err.details;

  res.status(status).json(body);
}

module.exports = errorHandler;
