'use strict';

const productService = require('./product.service');
const { success } = require('../../shared/utils/apiResponse');
const catchAsync = require('../../shared/utils/catchAsync');

const getAll = catchAsync(async (req, res) => {
  const products = await productService.getAllProducts();
  success(res, { message: 'Products retrieved.', data: products });
});

const getOne = catchAsync(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  success(res, { message: 'Product retrieved.', data: product });
});

const create = catchAsync(async (req, res) => {
  const product = await productService.createProduct(req.body);
  success(res, { statusCode: 201, message: 'Product created.', data: product });
});

const update = catchAsync(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  success(res, { message: 'Product updated.', data: product });
});

const remove = catchAsync(async (req, res) => {
  await productService.deleteProduct(req.params.id);
  success(res, { message: 'Product deleted.' });
});

module.exports = { getAll, getOne, create, update, remove };
