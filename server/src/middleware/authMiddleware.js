const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next(ApiError.unauthorized());
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(ApiError.unauthorized('Invalid token'));
  }
}

module.exports = authMiddleware;
