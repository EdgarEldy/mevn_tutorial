'use strict';

const orderService = require('../../modules/orders/order.service');
const { requireAuth, requireRole } = require('../guards');

module.exports = {
  Query: {
    orders: (_, __, context) => {
      requireAuth(context);
      return orderService.getAllOrders();
    },
    order: (_, { id }, context) => {
      requireAuth(context);
      return orderService.getOrderById(id);
    },
  },
  Mutation: {
    createOrder: (_, { input }, context) => {
      requireRole(context, 'admin');
      return orderService.createOrder(input);
    },
    updateOrder: (_, { id, input }, context) => {
      requireRole(context, 'admin');
      return orderService.updateOrder(id, input);
    },
    deleteOrder: async (_, { id }, context) => {
      requireRole(context, 'admin');
      await orderService.deleteOrder(id);
      return true;
    },
  },
};
