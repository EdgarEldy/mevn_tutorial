'use strict';

const { body, param } = require('express-validator');

const idParam = param('id').isInt().withMessage('id must be an integer.');

const getCategory = [idParam];

const createCategory = [
  body('category_name').notEmpty().withMessage('category_name is required.').isLength({ max: 255 }),
];

const updateCategory = [
  idParam,
  body('category_name')
    .optional()
    .notEmpty()
    .withMessage('category_name cannot be empty.')
    .isLength({ max: 255 }),
];

const deleteCategory = [idParam];

module.exports = { getCategory, createCategory, updateCategory, deleteCategory };
