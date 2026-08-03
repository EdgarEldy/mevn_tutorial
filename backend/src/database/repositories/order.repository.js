'use strict';

const { Order, Customer, Product, Category } = require('../models');

const include = [
  { model: Customer, as: 'customer' },
  { model: Product, as: 'product', include: [{ model: Category, as: 'category' }] },
];

const findAll = () => Order.findAll({ include });
const findById = (id) => Order.findByPk(id, { include });
const create = async (data) => {
  const order = await Order.create(data);
  return findById(order.id);
};
const update = (id, data) => Order.update(data, { where: { id } });
const destroy = (id) => Order.destroy({ where: { id } });

module.exports = { findAll, findById, create, update, destroy };
