'use strict';

const customerService = require('./customer.service');
const { success } = require('../../shared/utils/apiResponse');
const catchAsync = require('../../shared/utils/catchAsync');

const getAll = catchAsync(async (req, res) => {
  const customers = await customerService.getAllCustomers();
  success(res, { message: 'Customers retrieved.', data: customers });
});

const getOne = catchAsync(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id);
  success(res, { message: 'Customer retrieved.', data: customer });
});

const create = catchAsync(async (req, res) => {
  const customer = await customerService.createCustomer(req.body);
  success(res, { statusCode: 201, message: 'Customer created.', data: customer });
});

const update = catchAsync(async (req, res) => {
  const customer = await customerService.updateCustomer(req.params.id, req.body);
  success(res, { message: 'Customer updated.', data: customer });
});

const remove = catchAsync(async (req, res) => {
  await customerService.deleteCustomer(req.params.id);
  success(res, { message: 'Customer deleted.' });
});

module.exports = { getAll, getOne, create, update, remove };
