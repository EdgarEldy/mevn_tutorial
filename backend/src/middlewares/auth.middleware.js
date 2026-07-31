const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { error } = require('../shared/utils/apiResponse');

function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, { statusCode: 401, message: 'Authentication token missing.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    req.tokenDecoded = jwt.verify(token, env.jwtSecret);
    req.token = token;
    next();
  } catch (err) {
    return error(res, { statusCode: 401, message: 'Invalid or expired token.' });
  }
}

module.exports = { protect };
