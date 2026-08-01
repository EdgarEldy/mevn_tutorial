'use strict';

const { Customer } = require('../models');

const findAll = () => Customer.findAll();
const findById = (id) => Customer.findByPk(id);
// MySQL has no RETURNING clause: an unset attribute on Customer.create(data)
// comes back as undefined (dropped from the JSON response) rather than the
// null the column actually holds. Re-fetching avoids silently missing keys.
const create = async (data) => {
  const customer = await Customer.create(data);
  return findById(customer.id);
};
const update = (id, data) => Customer.update(data, { where: { id } });
const destroy = (id) => Customer.destroy({ where: { id } });

module.exports = { findAll, findById, create, update, destroy };
