'use strict';

const categoryService = require('./category.service');
const { success } = require('../../shared/utils/apiResponse');
const catchAsync = require('../../shared/utils/catchAsync');

const getAll = catchAsync(async (req, res) => {
  const categories = await categoryService.getAllCategories();
  success(res, { message: 'Categories retrieved.', data: categories });
});

const getOne = catchAsync(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);
  success(res, { message: 'Category retrieved.', data: category });
});

const create = catchAsync(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  success(res, { statusCode: 201, message: 'Category created.', data: category });
});

const update = catchAsync(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  success(res, { message: 'Category updated.', data: category });
});

const remove = catchAsync(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  success(res, { message: 'Category deleted.' });
});

module.exports = { getAll, getOne, create, update, remove };
