const requireAdmin = require('../middlewares/requireAdmin');

describe('requireAdmin', () => {
  it('calls next with a 403 error when user role is not ADMIN', () => {
    const next = jest.fn();
    const req = { user: { role: 'USER' } };

    requireAdmin(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].status).toBe(403);
  });

  it('calls next() with no args when user role is ADMIN', () => {
    const next = jest.fn();
    const req = { user: { role: 'ADMIN' } };

    requireAdmin(req, {}, next);

    expect(next).toHaveBeenCalledWith();
  });
});
