'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { error } = require('../shared/utils/apiResponse');
const blacklistedTokenRepository = require('../database/repositories/blacklisted-token.repository');
const userRepository = require('../database/repositories/user.repository');

async function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, { statusCode: 401, message: 'Authentication token missing.' });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    return error(res, { statusCode: 401, message: 'Invalid or expired token.' });
  }

  const blacklisted = await blacklistedTokenRepository.findByJti(decoded.jti);
  if (blacklisted) {
    return error(res, { statusCode: 401, message: 'Token has been revoked.' });
  }

  const user = await userRepository.findById(decoded.id);
  if (!user) {
    return error(res, { statusCode: 401, message: 'User not found.' });
  }
  if (!user.enabled) {
    return error(res, { statusCode: 403, message: 'Account is not activated.' });
  }
  if (user.account_locked) {
    return error(res, { statusCode: 403, message: 'Account is locked.' });
  }

  // Defense in depth: nothing currently serializes req.user directly, but strip the
  // bcrypt hash anyway so a future handler can't accidentally leak it.
  user.password = undefined;

  req.user = user;
  req.token = token;
  req.tokenDecoded = decoded;
  next();
}

module.exports = { protect };
