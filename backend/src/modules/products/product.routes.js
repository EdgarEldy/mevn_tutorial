'use strict';

const { Router } = require('express');
const controller = require('./product.controller');
const validate = require('../../middlewares/validate.middleware');
const { getProduct, createProduct, updateProduct, deleteProduct } = require('./product.validation');

const router = Router();

router.get('/', controller.getAll);
router.get('/:id', getProduct, validate, controller.getOne);
router.post('/', createProduct, validate, controller.create);
router.put('/:id', updateProduct, validate, controller.update);
router.delete('/:id', deleteProduct, validate, controller.remove);

module.exports = router;
