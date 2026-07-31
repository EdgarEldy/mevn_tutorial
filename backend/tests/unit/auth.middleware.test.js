const jwt = require('jsonwebtoken');

const JWT_SECRET = 'test_secret';

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function loadMiddleware() {
  jest.resetModules();
  jest.doMock('../../src/config/env', () => ({ jwtSecret: JWT_SECRET }));
  // eslint-disable-next-line global-require
  return require('../../src/middlewares/auth.middleware');
}

describe('auth.middleware protect', () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock('../../src/config/env');
  });

  it('missing Authorization header returns 401', () => {
    const { protect } = loadMiddleware();
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Authentication token missing.',
      errors: null,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('malformed Authorization header (no Bearer prefix) returns 401', () => {
    const { protect } = loadMiddleware();
    const req = { headers: { authorization: 'Basic sometoken' } };
    const res = mockRes();
    const next = jest.fn();

    protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Authentication token missing.',
      errors: null,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('invalid/expired token returns 401', () => {
    const { protect } = loadMiddleware();
    const req = { headers: { authorization: 'Bearer not-a-real-token' } };
    const res = mockRes();
    const next = jest.fn();

    protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid or expired token.',
      errors: null,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('token signed with a different secret returns 401', () => {
    const { protect } = loadMiddleware();
    const token = jwt.sign({ id: 1 }, 'wrong_secret');
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('valid token sets req.tokenDecoded and req.token, then calls next with no error', () => {
    const { protect } = loadMiddleware();
    const payload = { id: 42, email: 'ed.eldy21@gmail.com' };
    const token = jwt.sign(payload, JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    protect(req, res, next);

    expect(req.token).toBe(token);
    expect(req.tokenDecoded).toMatchObject(payload);
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
