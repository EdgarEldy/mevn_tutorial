'use strict';

const { Router } = require('express');
const controller = require('./order.controller');
const validate = require('../../middlewares/validate.middleware');
const { protect } = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/authorize.middleware');
const { getOrder, createOrder, updateOrder, deleteOrder } = require('./order.validation');

const router = Router();

router.get('/', protect, controller.getAll);
router.get('/:id', protect, getOrder, validate, controller.getOne);
router.post('/', protect, authorize('admin'), createOrder, validate, controller.create);
router.put('/:id', protect, authorize('admin'), updateOrder, validate, controller.update);
router.delete('/:id', protect, authorize('admin'), deleteOrder, validate, controller.remove);

module.exports = router;
