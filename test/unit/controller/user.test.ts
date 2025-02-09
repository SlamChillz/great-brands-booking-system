import { Request, Response, NextFunction } from 'express';
import { UserController } from '../../../src/api/rest/controllers/v1';
import { UserService } from '../../../src/services';
import { logger } from '../../../src/utils/logger';
import { createUserSchema } from '../../../src/api/rest/validation/user';
import { ValidationError } from 'joi';
import httpStatus from 'http-status';

// Mock the UserService and logger
jest.mock('../../../src/services');
jest.mock('../../../src/utils/logger');

describe('UserController - Unit Tests', () => {
  let userController: UserController;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    userController = new UserController();
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      req.body = { username: 'testuser', password: 'password123' };

      jest.spyOn(createUserSchema, 'validate').mockReturnValue({
        error: undefined,
        value: { username: 'testuser', password: 'password123' },
      });

      const mockResult = {
        status: 'success',
        code: 201,
        message: 'User created successfully.',
        data: { user: { id: 1, username: 'testuser' } },
      };
      (UserService.create as jest.Mock).mockResolvedValue(mockResult);

      await userController.create(req as Request, res as Response, next);
      expect(createUserSchema.validate).toHaveBeenCalledWith(
        { username: 'testuser', password: 'password123' },
        { abortEarly: false },
      );
      expect(UserService.create).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
      expect(res.status).toHaveBeenCalledWith(httpStatus.CREATED);
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      req.body = { username: '', password: '' };
      const details = [
        {
          message: '"username" is required',
          path: ['username'],
          type: 'any.required',
          context: { label: 'username', key: 'username' },
        },
        {
          message: '"password" is required',
          path: ['password'],
          type: 'any.required',
          context: { label: 'password', key: 'password' },
        }
      ];
      const mockError = new ValidationError("Validation failed", details, null);
      jest.spyOn(createUserSchema, 'validate').mockReturnValue({
        error: mockError,
        value: null,
      });
      await userController.create(req as Request, res as Response, next);
      expect(createUserSchema.validate).toHaveBeenCalledWith(
        { username: '', password: '' },
        { abortEarly: false },
      );
      expect(next).toHaveBeenCalledWith(mockError);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should handle errors during user creation', async () => {
      req.body = { username: 'testuser', password: 'password123' };

      jest.spyOn(createUserSchema, 'validate').mockReturnValue({
        error: undefined,
        value: { username: 'testuser', password: 'password123' },
      });

      const mockError = new Error('User creation failed');
      (UserService.create as jest.Mock).mockRejectedValue(mockError);

      await userController.create(req as Request, res as Response, next);
      expect(UserService.create).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
      expect(logger.error).toHaveBeenCalledWith(
        'User controller errored while creating user',
        mockError,
      );
      expect(res.status).toHaveBeenCalledWith(httpStatus.INTERNAL_SERVER_ERROR);
    });
  });
});
