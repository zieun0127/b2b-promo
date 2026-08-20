const jwt = require('jsonwebtoken');
const requireAuth = require('../middlewares/requireAuth');

function createReq(headers = {}) {
  return { headers };
}

describe('requireAuth', () => {
  it('calls next with a 401 error when Authorization header is missing', () => {
    const next = jest.fn();
    requireAuth(createReq(), {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].status).toBe(401);
  });

  it('calls next with a 401 error when the token is invalid', () => {
    const next = jest.fn();
    requireAuth(createReq({ authorization: 'Bearer invalid.token.here' }), {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].status).toBe(401);
  });

  it('calls next() with no args and sets req.user when the token is valid', () => {
    const token = jwt.sign({ sub: 'user-id-1', role: 'USER' }, process.env.JWT_ACCESS_SECRET, {
      expiresIn: '15m',
    });
    const next = jest.fn();
    const req = createReq({ authorization: `Bearer ${token}` });

    requireAuth(req, {}, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual({ id: 'user-id-1', role: 'USER' });
  });
});
