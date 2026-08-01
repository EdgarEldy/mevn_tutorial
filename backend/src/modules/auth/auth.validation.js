'use strict';

const { body } = require('express-validator');

const register = [
  body('first_name').trim().notEmpty().withMessage('first_name is required.').isLength({ max: 50 }),
  body('last_name').trim().notEmpty().withMessage('last_name is required.').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('password must be at least 8 characters.'),
];

const login = [
  body('email').trim().isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('password is required.'),
];

const forgotPassword = [
  body('email').trim().isEmail().withMessage('A valid email is required.').normalizeEmail(),
];

const resetPassword = [
  body('token').notEmpty().withMessage('token is required.'),
  body('password').isLength({ min: 8 }).withMessage('password must be at least 8 characters.'),
];

module.exports = { register, login, forgotPassword, resetPassword };
