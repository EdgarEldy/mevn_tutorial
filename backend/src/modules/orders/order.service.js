'use strict';

const orderRepository = require('../../database/repositories/order.repository');
const productRepository = require('../../database/repositories/product.repository');
const customerRepository = require('../../database/repositories/customer.repository');

const getAllOrders = () => orderRepository.findAll();

const getOrderById = async (id) => {
  const order = await orderRepository.findById(id);
  if (!order) {
    const err = new Error('Order not found.');
    err.statusCode = 404;
    throw err;
  }
  return order;
};

const getProductOrThrow = async (productId) => {
  const product = await productRepository.findById(productId);
  if (!product) {
    const err = new Error('Product not found.');
    err.statusCode = 404;
    throw err;
  }
  return product;
};

const assertCustomerExists = async (customerId) => {
  const customer = await customerRepository.findById(customerId);
  if (!customer) {
    const err = new Error('Customer not found.');
    err.statusCode = 404;
    throw err;
  }
};

const createOrder = async (data) => {
  await assertCustomerExists(data.customer_id);
  const product = await getProductOrThrow(data.product_id);
  const total = data.quantity * product.unit_price;
  return orderRepository.create({ ...data, total });
};

const updateOrder = async (id, data) => {
  const order = await getOrderById(id);

  if (data.customer_id !== undefined) {
    await assertCustomerExists(data.customer_id);
  }

  const productId = data.product_id !== undefined ? data.product_id : order.product_id;
  const quantity = data.quantity !== undefined ? data.quantity : order.quantity;
  const product = await getProductOrThrow(productId);
  const total = quantity * product.unit_price;

  await orderRepository.update(id, { ...data, total });
  return orderRepository.findById(id);
};

const deleteOrder = async (id) => {
  await getOrderById(id);
  return orderRepository.destroy(id);
};

module.exports = { getAllOrders, getOrderById, createOrder, updateOrder, deleteOrder };
