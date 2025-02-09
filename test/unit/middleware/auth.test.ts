import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { authMiddy } from '../../../src/api/rest/middlewares'; // Adjust the import path
import { UserService } from '../../../src/services'; // Adjust the import path
import { logger } from '../../../src/utils/logger'; // Adjust the import path

// Mock the UserService and logger
jest.mock('../../../src/services');
jest.mock('../../../src/utils/logger');

describe('authMiddy - Unit Tests', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 401 if Authorization header is missing', async () => {
    await authMiddy(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(httpStatus.UNAUTHORIZED);
    expect(res.json).toHaveBeenCalledWith({
      status: 'failed',
      message: 'Missing or invalid Authorization header',
      error: {},
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if Authorization header is invalid', async () => {
    req.headers = { authorization: 'InvalidHeader' };
    await authMiddy(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(httpStatus.UNAUTHORIZED);
    expect(res.json).toHaveBeenCalledWith({
      status: 'failed',
      message: 'Missing or invalid Authorization header',
      error: {},
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if authentication fails', async () => {
    req.headers = { authorization: 'Basic dGVzdHVzZXI6cGFzc3dvcmQxMjM=' }; // Base64 for 'testuser:password123'
    (UserService.authenticate as jest.Mock).mockResolvedValue({
      status: 'failed',
      code: httpStatus.UNAUTHORIZED,
      message: 'Unauthorized request',
      userId: null,
    });
    await authMiddy(req as Request, res as Response, next);

    expect(UserService.authenticate).toHaveBeenCalledWith('testuser', 'password123');
    expect(res.status).toHaveBeenCalledWith(httpStatus.UNAUTHORIZED);
    expect(res.json).toHaveBeenCalledWith({
      status: 'failed',
      message: 'Unauthorized request',
      error: {},
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should set userId in headers and call next if authentication succeeds', async () => {
    req.headers = { authorization: 'Basic dGVzdHVzZXI6cGFzc3dvcmQxMjM=' }; // Base64 for 'testuser:password123'

    (UserService.authenticate as jest.Mock).mockResolvedValue({
      status: 'success',
      code: httpStatus.OK,
      message: '',
      userId: '123',
    });
    await authMiddy(req as Request, res as Response, next);

    expect(UserService.authenticate).toHaveBeenCalledWith('testuser', 'password123');
    expect(req.headers['userId']).toBe('123');
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should return 500 if authentication throws an error', async () => {
    req.headers = { authorization: 'Basic dGVzdHVzZXI6cGFzc3dvcmQxMjM=' };

    const mockError = new Error('Authentication failed');
    (UserService.authenticate as jest.Mock).mockRejectedValue(mockError);
    await authMiddy(req as Request, res as Response, next);

    expect(UserService.authenticate).toHaveBeenCalledWith('testuser', 'password123');
    expect(logger.error).toHaveBeenCalledWith('Error authenticating user', { error: mockError });
    expect(res.status).toHaveBeenCalledWith(httpStatus.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: httpStatus['500'],
      error: {},
    });
    expect(next).not.toHaveBeenCalled();
  });
});
