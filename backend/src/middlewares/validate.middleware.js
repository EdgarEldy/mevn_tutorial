'use strict';

const { validationResult } = require('express-validator');
const { error } = require('../shared/utils/apiResponse');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(res, { statusCode: 422, message: 'Validation failed.', errors: errors.array() });
  }
  next();
}

module.exports = validate;
