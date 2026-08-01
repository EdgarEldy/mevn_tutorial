'use strict';

const { Router } = require('express');
const controller = require('./order.controller');
const validate = require('../../middlewares/validate.middleware');
const { getOrder, createOrder, updateOrder, deleteOrder } = require('./order.validation');

const router = Router();

router.get('/', controller.getAll);
router.get('/:id', getOrder, validate, controller.getOne);
router.post('/', createOrder, validate, controller.create);
router.put('/:id', updateOrder, validate, controller.update);
router.delete('/:id', deleteOrder, validate, controller.remove);

module.exports = router;
