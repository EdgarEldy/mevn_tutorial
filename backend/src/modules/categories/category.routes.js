'use strict';

const { Router } = require('express');
const controller = require('./category.controller');
const validate = require('../../middlewares/validate.middleware');
const { protect } = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/authorize.middleware');
const { getCategory, createCategory, updateCategory, deleteCategory } = require('./category.validation');

const router = Router();

router.get('/', controller.getAll);
router.get('/:id', getCategory, validate, controller.getOne);
router.post('/', protect, authorize('admin'), createCategory, validate, controller.create);
router.put('/:id', protect, authorize('admin'), updateCategory, validate, controller.update);
router.delete('/:id', protect, authorize('admin'), deleteCategory, validate, controller.remove);

module.exports = router;
