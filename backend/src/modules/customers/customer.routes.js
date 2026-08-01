'use strict';

const { Router } = require('express');
const controller = require('./customer.controller');
const validate = require('../../middlewares/validate.middleware');
const { getCustomer, createCustomer, updateCustomer, deleteCustomer } = require('./customer.validation');

const router = Router();

router.get('/', controller.getAll);
router.get('/:id', getCustomer, validate, controller.getOne);
router.post('/', createCustomer, validate, controller.create);
router.put('/:id', updateCustomer, validate, controller.update);
router.delete('/:id', deleteCustomer, validate, controller.remove);

module.exports = router;
