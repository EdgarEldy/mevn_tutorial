const { success, error } = require('../../src/shared/utils/apiResponse');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('apiResponse.success', () => {
  it('uses default statusCode, message, and data when none provided', () => {
    const res = mockRes();

    success(res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Success.',
      data: null,
    });
  });

  it('uses provided statusCode, message, and data when overridden', () => {
    const res = mockRes();
    const data = { id: 1 };

    success(res, { statusCode: 201, message: 'Created.', data });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Created.',
      data,
    });
  });
});

describe('apiResponse.error', () => {
  it('uses default statusCode, message, and errors when none provided', () => {
    const res = mockRes();

    error(res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Something went wrong.',
      errors: null,
    });
  });

  it('uses provided statusCode, message, and errors when overridden', () => {
    const res = mockRes();
    const errors = [{ field: 'email', message: 'Invalid email.' }];

    error(res, { statusCode: 422, message: 'Validation failed.', errors });

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Validation failed.',
      errors,
    });
  });
});
