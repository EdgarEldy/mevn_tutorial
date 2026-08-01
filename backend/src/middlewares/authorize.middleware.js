'use strict';

const { error } = require('../shared/utils/apiResponse');

// Runs after auth.middleware.js's protect, which populates req.user (with its
// roles eager-loaded via userRepository.findById). No equivalent exists in the
// reference implementation this project's backend is otherwise modeled on -
// this is new code for this project's real RBAC enforcement decision.
function authorize(requiredRole) {
  return (req, res, next) => {
    const roles = (req.user && req.user.roles) || [];
    const hasRole = roles.some((role) => role.role_name === requiredRole);

    if (!hasRole) {
      return error(res, { statusCode: 403, message: 'Insufficient permissions.' });
    }

    next();
  };
}

module.exports = authorize;
