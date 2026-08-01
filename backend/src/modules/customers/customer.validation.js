'use strict';

const { body, param } = require('express-validator');

const idParam = param('id').isInt().withMessage('id must be an integer.');

const getCustomer = [idParam];

const customerFields = [
  body('first_name').optional({ nullable: true }).isString().isLength({ max: 255 }),
  body('last_name').optional({ nullable: true }).isString().isLength({ max: 255 }),
  body('telephone').optional({ nullable: true }).isString().isLength({ max: 50 }),
  body('email').optional({ nullable: true }).isEmail().isLength({ max: 255 }),
  body('address').optional({ nullable: true }).isString().isLength({ max: 255 }),
];

const createCustomer = [...customerFields];

const updateCustomer = [idParam, ...customerFields];

const deleteCustomer = [idParam];

module.exports = { getCustomer, createCustomer, updateCustomer, deleteCustomer };
