function mockRes() {
  const res = {};
  res.headersSent = false;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function loadMiddleware(nodeEnv) {
  jest.resetModules();
  jest.doMock('../../src/config/env', () => ({ nodeEnv }));
  // eslint-disable-next-line global-require
  return require('../../src/middlewares/error.middleware');
}

describe('errorMiddleware', () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock('../../src/config/env');
  });

  it('uses default statusCode and message when err has none, in production', () => {
    const errorMiddleware = loadMiddleware('production');
    const res = mockRes();
    const next = jest.fn();
    const err = {};

    errorMiddleware(err, {}, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Something went wrong.',
      errors: null,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('uses err statusCode and message when provided, in production', () => {
    const errorMiddleware = loadMiddleware('production');
    const res = mockRes();
    const next = jest.fn();
    const err = { statusCode: 404, message: 'Not found.' };

    errorMiddleware(err, {}, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not found.',
      errors: null,
    });
  });

  it('always includes the errors key even when err.errors is undefined', () => {
    const errorMiddleware = loadMiddleware('production');
    const res = mockRes();
    const next = jest.fn();
    const err = { statusCode: 422, message: 'Validation failed.', errors: [{ field: 'email' }] };

    errorMiddleware(err, {}, res, next);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Validation failed.',
      errors: [{ field: 'email' }],
    });
  });

  it('omits stack when env.nodeEnv is production', () => {
    const errorMiddleware = loadMiddleware('production');
    const res = mockRes();
    const next = jest.fn();
    const err = { statusCode: 500, message: 'Boom.', stack: 'Error: Boom.\n at somewhere' };

    errorMiddleware(err, {}, res, next);

    const body = res.json.mock.calls[0][0];
    expect(body).not.toHaveProperty('stack');
  });

  it('includes stack when env.nodeEnv is development', () => {
    const errorMiddleware = loadMiddleware('development');
    const res = mockRes();
    const next = jest.fn();
    const err = { statusCode: 500, message: 'Boom.', stack: 'Error: Boom.\n at somewhere' };

    errorMiddleware(err, {}, res, next);

    const body = res.json.mock.calls[0][0];
    expect(body.stack).toBe(err.stack);
  });

  it('calls next with err instead of sending a response when headers already sent', () => {
    const errorMiddleware = loadMiddleware('production');
    const res = mockRes();
    res.headersSent = true;
    const next = jest.fn();
    const err = { statusCode: 500, message: 'Boom.' };

    errorMiddleware(err, {}, res, next);

    expect(next).toHaveBeenCalledWith(err);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
