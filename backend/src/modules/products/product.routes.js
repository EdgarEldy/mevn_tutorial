'use strict';

const { Router } = require('express');
const controller = require('./product.controller');
const validate = require('../../middlewares/validate.middleware');
const { protect } = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/authorize.middleware');
const { getProduct, createProduct, updateProduct, deleteProduct } = require('./product.validation');

const router = Router();

router.get('/', controller.getAll);
router.get('/:id', getProduct, validate, controller.getOne);
router.post('/', protect, authorize('admin'), createProduct, validate, controller.create);
router.put('/:id', protect, authorize('admin'), updateProduct, validate, controller.update);
router.delete('/:id', protect, authorize('admin'), deleteProduct, validate, controller.remove);

module.exports = router;
