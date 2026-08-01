'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = 'test_secret';

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// jest.resetModules() clears the require cache, so a fresh require of
// auth.middleware.js (and, transitively, the repositories it imports) after
// this call needs its own jest.doMock factories registered first - relying on
// a file-top jest.mock(...) here produced mocks that weren't the same object
// instances auth.middleware.js ended up calling internally.
function loadMiddleware() {
  jest.resetModules();
  jest.doMock('../../src/config/env', () => ({ jwtSecret: JWT_SECRET }));
  jest.doMock('../../src/database/repositories/blacklisted-token.repository', () => ({
    findByJti: jest.fn(),
  }));
  jest.doMock('../../src/database/repositories/user.repository', () => ({
    findById: jest.fn(),
  }));
  // eslint-disable-next-line global-require
  const blacklistedTokenRepository = require('../../src/database/repositories/blacklisted-token.repository');
  // eslint-disable-next-line global-require
  const userRepository = require('../../src/database/repositories/user.repository');
  // eslint-disable-next-line global-require
  const { protect } = require('../../src/middlewares/auth.middleware');
  return { protect, blacklistedTokenRepository, userRepository };
}

describe('auth.middleware protect', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    jest.dontMock('../../src/config/env');
    jest.dontMock('../../src/database/repositories/blacklisted-token.repository');
    jest.dontMock('../../src/database/repositories/user.repository');
  });

  it('missing Authorization header returns 401', async () => {
    const { protect } = loadMiddleware();
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Authentication token missing.',
      errors: null,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('malformed Authorization header (no Bearer prefix) returns 401', async () => {
    const { protect } = loadMiddleware();
    const req = { headers: { authorization: 'Basic sometoken' } };
    const res = mockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('invalid/expired token returns 401', async () => {
    const { protect } = loadMiddleware();
    const req = { headers: { authorization: 'Bearer not-a-real-token' } };
    const res = mockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid or expired token.',
      errors: null,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the token jti is blacklisted', async () => {
    const { protect, blacklistedTokenRepository } = loadMiddleware();
    const token = jwt.sign({ id: 1, jti: 'revoked-jti' }, JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();
    blacklistedTokenRepository.findByJti.mockResolvedValue({ id: 1, jti: 'revoked-jti' });

    await protect(req, res, next);

    expect(blacklistedTokenRepository.findByJti).toHaveBeenCalledWith('revoked-jti');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Token has been revoked.',
      errors: null,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the user no longer exists', async () => {
    const { protect, blacklistedTokenRepository, userRepository } = loadMiddleware();
    const token = jwt.sign({ id: 99, jti: 'jti' }, JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();
    blacklistedTokenRepository.findByJti.mockResolvedValue(null);
    userRepository.findById.mockResolvedValue(null);

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'User not found.',
      errors: null,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when the account is not enabled', async () => {
    const { protect, blacklistedTokenRepository, userRepository } = loadMiddleware();
    const token = jwt.sign({ id: 1, jti: 'jti' }, JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();
    blacklistedTokenRepository.findByJti.mockResolvedValue(null);
    userRepository.findById.mockResolvedValue({ id: 1, enabled: false, account_locked: false });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Account is not activated.',
      errors: null,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when the account is locked', async () => {
    const { protect, blacklistedTokenRepository, userRepository } = loadMiddleware();
    const token = jwt.sign({ id: 1, jti: 'jti' }, JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();
    blacklistedTokenRepository.findByJti.mockResolvedValue(null);
    userRepository.findById.mockResolvedValue({ id: 1, enabled: true, account_locked: true });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Account is locked.',
      errors: null,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('valid token, existing enabled/unlocked user: sets req.user/token/tokenDecoded and calls next', async () => {
    const { protect, blacklistedTokenRepository, userRepository } = loadMiddleware();
    const payload = { id: 42, email: 'ed.eldy21@gmail.com', jti: 'jti-ok' };
    const token = jwt.sign(payload, JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();
    const user = { id: 42, enabled: true, account_locked: false, roles: [{ role_name: 'admin' }] };
    blacklistedTokenRepository.findByJti.mockResolvedValue(null);
    userRepository.findById.mockResolvedValue(user);

    await protect(req, res, next);

    expect(req.token).toBe(token);
    expect(req.user).toBe(user);
    expect(req.tokenDecoded).toMatchObject(payload);
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
