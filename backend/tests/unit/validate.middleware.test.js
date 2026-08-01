'use strict';

const { body, validationResult } = require('express-validator');
const validate = require('../../src/middlewares/validate.middleware');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

async function runValidation(req, rules) {
  for (const rule of rules) {
    // eslint-disable-next-line no-await-in-loop
    await rule.run(req);
  }
}

describe('validate.middleware', () => {
  it('calls next() when there are no validation errors', async () => {
    const req = { body: { category_name: 'Books' } };
    const rules = [body('category_name').notEmpty()];
    await runValidation(req, rules);
    const res = mockRes();
    const next = jest.fn();

    validate(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 422 with the standard envelope when there are validation errors', async () => {
    const req = { body: {} };
    const rules = [body('category_name').notEmpty().withMessage('category_name is required.')];
    await runValidation(req, rules);
    const res = mockRes();
    const next = jest.fn();

    validate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(422);
    const body_ = res.json.mock.calls[0][0];
    expect(body_.success).toBe(false);
    expect(body_.message).toBe('Validation failed.');
    expect(Array.isArray(body_.errors)).toBe(true);
    expect(validationResult(req).isEmpty()).toBe(false);
  });
});
