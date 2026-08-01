'use strict';

const { Router } = require('express');
const controller = require('./customer.controller');
const validate = require('../../middlewares/validate.middleware');
const { protect } = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/authorize.middleware');
const { getCustomer, createCustomer, updateCustomer, deleteCustomer } = require('./customer.validation');

const router = Router();

router.get('/', protect, controller.getAll);
router.get('/:id', protect, getCustomer, validate, controller.getOne);
router.post('/', protect, authorize('admin'), createCustomer, validate, controller.create);
router.put('/:id', protect, authorize('admin'), updateCustomer, validate, controller.update);
router.delete('/:id', protect, authorize('admin'), deleteCustomer, validate, controller.remove);

module.exports = router;
