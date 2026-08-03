'use strict';

const orderService = require('./order.service');
const { success } = require('../../shared/utils/apiResponse');
const catchAsync = require('../../shared/utils/catchAsync');

const getAll = catchAsync(async (req, res) => {
  const orders = await orderService.getAllOrders();
  success(res, { message: 'Orders retrieved.', data: orders });
});

const getOne = catchAsync(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id);
  success(res, { message: 'Order retrieved.', data: order });
});

const create = catchAsync(async (req, res) => {
  const order = await orderService.createOrder(req.body);
  success(res, { statusCode: 201, message: 'Order created.', data: order });
});

const update = catchAsync(async (req, res) => {
  const order = await orderService.updateOrder(req.params.id, req.body);
  success(res, { message: 'Order updated.', data: order });
});

const remove = catchAsync(async (req, res) => {
  await orderService.deleteOrder(req.params.id);
  success(res, { message: 'Order deleted.' });
});

module.exports = { getAll, getOne, create, update, remove };
