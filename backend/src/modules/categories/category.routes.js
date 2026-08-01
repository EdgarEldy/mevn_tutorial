'use strict';

const { Router } = require('express');
const controller = require('./category.controller');
const validate = require('../../middlewares/validate.middleware');
const { getCategory, createCategory, updateCategory, deleteCategory } = require('./category.validation');

const router = Router();

router.get('/', controller.getAll);
router.get('/:id', getCategory, validate, controller.getOne);
router.post('/', createCategory, validate, controller.create);
router.put('/:id', updateCategory, validate, controller.update);
router.delete('/:id', deleteCategory, validate, controller.remove);

module.exports = router;
