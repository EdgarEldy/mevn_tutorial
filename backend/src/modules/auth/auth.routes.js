'use strict';

const { Router } = require('express');
const controller = require('./auth.controller');
const validate = require('../../middlewares/validate.middleware');
const { protect } = require('../../middlewares/auth.middleware');
const { register, login, forgotPassword, resetPassword } = require('./auth.validation');

const router = Router();

router.post('/register', register, validate, controller.register);
router.get('/activate/:token', controller.activate);
router.post('/login', login, validate, controller.login);
router.post('/logout', protect, controller.logout);
router.post('/forgot-password', forgotPassword, validate, controller.forgotPassword);
router.post('/reset-password', resetPassword, validate, controller.resetPassword);

module.exports = router;
