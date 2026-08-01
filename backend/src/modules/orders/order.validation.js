'use strict';

const { body, param } = require('express-validator');

const idParam = param('id').isInt().withMessage('id must be an integer.');

const getOrder = [idParam];

const createOrder = [
  body('customer_id').notEmpty().withMessage('customer_id is required.').isInt({ min: 1 }),
  body('product_id').notEmpty().withMessage('product_id is required.').isInt({ min: 1 }),
  body('quantity').notEmpty().withMessage('quantity is required.').isInt({ min: 1 }),
];

const updateOrder = [
  idParam,
  body('customer_id').optional().isInt({ min: 1 }),
  body('product_id').optional().isInt({ min: 1 }),
  body('quantity').optional().isInt({ min: 1 }),
];

const deleteOrder = [idParam];

module.exports = { getOrder, createOrder, updateOrder, deleteOrder };
