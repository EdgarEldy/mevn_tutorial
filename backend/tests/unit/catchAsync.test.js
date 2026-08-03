const catchAsync = require('../../src/shared/utils/catchAsync');

describe('catchAsync', () => {
  it('resolving handler calls fn and does not call next', async () => {
    const req = {};
    const res = {};
    const next = jest.fn();
    const fn = jest.fn().mockResolvedValue('ok');

    const wrapped = catchAsync(fn);
    await wrapped(req, res, next);

    expect(fn).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejecting handler calls next with the error', async () => {
    const req = {};
    const res = {};
    const next = jest.fn();
    const err = new Error('boom');
    const fn = jest.fn().mockRejectedValue(err);

    const wrapped = catchAsync(fn);
    await wrapped(req, res, next);

    // allow the promise chain in catchAsync to settle
    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(err);
  });
});
