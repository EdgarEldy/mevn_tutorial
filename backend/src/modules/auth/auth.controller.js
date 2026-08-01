'use strict';

const authService = require('./auth.service');
const { success } = require('../../shared/utils/apiResponse');
const catchAsync = require('../../shared/utils/catchAsync');

const register = catchAsync(async (req, res) => {
  const user = await authService.register(req.body);
  success(res, {
    statusCode: 201,
    message: 'Registration successful. Check your email to activate your account.',
    data: user,
  });
});

const activate = catchAsync(async (req, res) => {
  await authService.activate(req.params.token);
  success(res, { message: 'Account activated successfully.' });
});

const login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body);
  success(res, { message: 'Login successful.', data: result });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout({ token: req.token, tokenDecoded: req.tokenDecoded });
  success(res, { message: 'Logged out successfully.' });
});

const forgotPassword = catchAsync(async (req, res) => {
  await authService.forgotPassword({ email: req.body.email });
  success(res, { message: 'If this email exists, a reset link has been sent.' });
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.body);
  success(res, { message: 'Password reset successfully.' });
});

module.exports = { register, activate, login, logout, forgotPassword, resetPassword };
