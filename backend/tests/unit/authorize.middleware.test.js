'use strict';

const authorize = require('../../src/middlewares/authorize.middleware');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('authorize.middleware', () => {
  it('calls next() when req.user has the required role', () => {
    const req = { user: { roles: [{ role_name: 'user' }, { role_name: 'admin' }] } };
    const res = mockRes();
    const next = jest.fn();

    authorize('admin')(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 403 when req.user lacks the required role', () => {
    const req = { user: { roles: [{ role_name: 'user' }] } };
    const res = mockRes();
    const next = jest.fn();

    authorize('admin')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Insufficient permissions.',
      errors: null,
    });
  });

  it('returns 403 when req.user has no roles at all', () => {
    const req = { user: { roles: [] } };
    const res = mockRes();
    const next = jest.fn();

    authorize('admin')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 403 when req.user is missing entirely (defensive, protect should always run first)', () => {
    const req = {};
    const res = mockRes();
    const next = jest.fn();

    authorize('admin')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
