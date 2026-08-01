'use strict';

const { body, param } = require('express-validator');

const idParam = param('id').isInt().withMessage('id must be an integer.');

const getProduct = [idParam];

const createProduct = [
  body('product_name').notEmpty().withMessage('product_name is required.').isLength({ max: 255 }),
  body('unit_price').notEmpty().withMessage('unit_price is required.').isFloat({ min: 0 }),
  body('category_id').notEmpty().withMessage('category_id is required.').isInt({ min: 1 }),
];

const updateProduct = [
  idParam,
  body('product_name').optional().notEmpty().withMessage('product_name cannot be empty.').isLength({ max: 255 }),
  body('unit_price').optional().isFloat({ min: 0 }),
  body('category_id').optional().isInt({ min: 1 }),
];

const deleteProduct = [idParam];

module.exports = { getProduct, createProduct, updateProduct, deleteProduct };
