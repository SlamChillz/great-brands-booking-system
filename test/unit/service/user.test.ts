import UserService from '../../../src/services/user';
import UserRepository from '../../../src/repository/user';
import httpStatus from 'http-status';
import { logger } from '../../../src/utils/logger';
import * as dbError from '../../../src/error/db';
import { User } from '../../../src/database/entity';
import { TRegisterUser } from '../../../src/types';

// Mock the UserRepository and logger
jest.mock('../../../src/database', () => ({
  db: {
    client: {
      getRepository: jest.fn()
    }
  }
}));
jest.mock('../../../src/repository/user');
jest.mock('../../../src/utils/logger');

describe('UserService', () => {
  let createMock: jest.SpyInstance<Promise<Omit<User, "password">>, [payload: TRegisterUser]>
  let userByNameMock: jest.SpyInstance<Promise<Omit<User, 'password'> | null>, [username: string]>;
  const userService = new UserService();
  const username = 'testUser'
  const password = 'password123'
  const payload = {username, password};
  const mockUser = new User();
  mockUser.username = username;
  mockUser.password = password;
  mockUser.created_at = new Date();
  mockUser.updated_at = new Date();

  // beforeEach(() => {
  //   jest.clearAllMocks()
  //   createMock = jest.spyOn(UserRepository, 'create')
  //   userByNameMock = jest.spyOn(UserRepository, 'userByName')
  // });

  describe('create', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      createMock = jest.spyOn(UserRepository, 'create')
      userByNameMock = jest.spyOn(UserRepository, 'userByName')
    });

    it('should create a new user successfully', async () => {
      createMock.mockImplementationOnce(() => Promise.resolve(mockUser));
      const result = await userService.create(payload);

      expect(result).toEqual({
        status: 'success',
        code: httpStatus.CREATED,
        message: 'User created successfully.',
        data: { user: mockUser },
      });
      expect(createMock).toHaveBeenCalledWith(payload);
      expect(logger.info).toHaveBeenCalledWith('New user created.');
    });

    it('should handle username conflict error', async () => {
      const conflictError = new Error(dbError.CONFLICT_CODE);
      createMock.mockImplementationOnce(() => {
        throw conflictError;
      });

      const result = await userService.create(payload);

      expect(result).toEqual({
        status: 'error',
        code: httpStatus.CONFLICT,
        message: httpStatus['409'],
        error: {
          username: 'username has been taken',
        },
      });
      expect(createMock).toHaveBeenCalledWith(payload);
    });

    it('should handle an errors that are not conflicts', async () => {
      const noneConflictError = new Error('None conflict error');
      createMock.mockImplementationOnce(() => {
        throw noneConflictError;
      });

      const result = await userService.create(payload);

      expect(result).toEqual({
        status: 'error',
        code: httpStatus.INTERNAL_SERVER_ERROR,
        message: httpStatus['500'],
        error: {},
      });
      expect(createMock).toHaveBeenCalledWith(payload);
      expect(logger.error).toHaveBeenCalledWith(
        'Unhandled error encountered while creating user',
        noneConflictError,
      )
    });

    it('should handle unknown errors', async () => {
      const unknownError = 'DB error';
      createMock.mockImplementationOnce(() => {
        throw unknownError;
      })
      const result = await userService.create(payload);

      expect(result).toEqual({
        status: 'error',
        code: httpStatus.INTERNAL_SERVER_ERROR,
        message: httpStatus['500'],
        error: {},
      });
      expect(createMock).toHaveBeenCalledWith(payload);
      expect(logger.error).toHaveBeenCalledWith(
        'Unknown error encountered while creating user',
        unknownError,
      );
    });
  });

  describe('authenticate', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      createMock = jest.spyOn(UserRepository, 'create')
      userByNameMock = jest.spyOn(UserRepository, 'userByName')
    });

    it('should authenticate a user successfully', async () => {
      mockUser.verifyPassword = jest.fn().mockImplementationOnce(() => Promise.resolve(true));
      userByNameMock.mockImplementationOnce(() => Promise.resolve(mockUser));
      const result = await userService.authenticate(username, password);

      expect(result).toEqual({
        status: 'success',
        code: httpStatus.OK,
        message: '',
        userId: mockUser.id,
      });
      expect(userByNameMock).toHaveBeenCalledWith(username);
      expect(mockUser.verifyPassword).toHaveBeenCalledWith(password);
    });

    it('should return unauthorized if user does not exist', async () => {
      userByNameMock.mockImplementationOnce(() => Promise.resolve(null));
      const result = await userService.authenticate(username, password);

      expect(result).toEqual({
        status: 'failed',
        code: httpStatus.UNAUTHORIZED,
        message: 'Unauthorized request',
        userId: null,
      });
      expect(userByNameMock).toHaveBeenCalledWith(username);
    });

    it('should return unauthorized if password is invalid', async () => {
      userByNameMock.mockImplementationOnce(() => Promise.resolve(mockUser));
      mockUser.verifyPassword = jest.fn().mockImplementationOnce(() => Promise.resolve(false));
      const result = await userService.authenticate(username, password);

      expect(result).toEqual({
        status: 'failed',
        code: httpStatus.UNAUTHORIZED,
        message: 'Invalid username or password in auth header',
        userId: null,
      });
      expect(userByNameMock).toHaveBeenCalledWith(username);
      expect(mockUser.verifyPassword).toHaveBeenCalledWith(password);
    });

    it('should handle errors during authentication', async () => {
      const error = new Error('Authentication failed');
      userByNameMock.mockImplementationOnce(() => Promise.reject(error));
      const result = await userService.authenticate(username, password);

      expect(result).toEqual({
        status: 'error',
        code: httpStatus.INTERNAL_SERVER_ERROR,
        message: httpStatus['500'],
        userId: null,
      });
      expect(userByNameMock).toHaveBeenCalledWith(username);
      expect(logger.error).toHaveBeenCalledWith('Error authenticating user', { error });
    });
  });
});
