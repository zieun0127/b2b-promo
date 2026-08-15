const { AppError, errorHandler } = require('../middlewares/errorHandler');

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  return res;
}

describe('errorHandler', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('handles AppError with its own status and message, no console.error', () => {
    const err = new AppError('bad request', 400);
    const res = createRes();

    errorHandler(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'bad request', status: 400 });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('handles a plain Error as 500 and logs via console.error', () => {
    const err = new Error('boom');
    const res = createRes();

    errorHandler(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'boom', status: 500 });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
