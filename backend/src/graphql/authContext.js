'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const blacklistedTokenRepository = require('../database/repositories/blacklisted-token.repository');
const userRepository = require('../database/repositories/user.repository');

// GraphQL has no route-level middleware chain to run auth.middleware.js's protect()
// through, so this rebuilds the same checks (minus the enabled/locked/blacklist
// checks becoming HTTP responses - Apollo's context function can't short-circuit
// the request the way Express middleware can) into an Apollo context function.
// Resolvers decide what to do with a null user via requireAuth/requireRole in
// guards.js, rather than this function throwing.
async function buildContext({ req }) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null };
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    return { user: null };
  }

  const blacklisted = await blacklistedTokenRepository.findByJti(decoded.jti);
  if (blacklisted) {
    return { user: null };
  }

  const user = await userRepository.findById(decoded.id);
  if (!user || !user.enabled || user.account_locked) {
    return { user: null };
  }

  // Defense in depth: no resolver currently returns the raw user, but strip the
  // bcrypt hash anyway so a future one can't accidentally leak it.
  user.password = undefined;

  return { user };
}

module.exports = buildContext;
