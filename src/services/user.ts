import { ServiceCart } from '../enum';
import UserRepository from '../repository/user';
import httpStatus from 'http-status';
import { logger } from '../utils/logger';
import * as dbError from '../error/db'

export default class UserService {
  private name = ServiceCart.USER;

  public async create(payload: {username: string, password: string}) {
    try {
      const user = await UserRepository.create(payload);
      logger.info('New user created.');
      return {
        status: 'success',
        code: httpStatus.CREATED,
        message: 'User created successfully.',
        data: {user}
      }
    } catch (error: unknown) {
      if (JSON.stringify(error).includes('23505')) {
        return {
          status: 'failed',
          code: httpStatus.CONFLICT,
          message: httpStatus['409'],
          error: {
            username: 'username has been taken',
          },
        }
      }
      logger.error('Error encountered while creating user', error);
      return {
        status: 'error',
        code: httpStatus.INTERNAL_SERVER_ERROR,
        message: httpStatus['500'],
        error: {},
      }
    }
  }

  public async authenticate(username: string, password: string) {
    try {
      const user = await UserRepository.userByName(username);
      if (!user) {
        return {
          status: 'failed',
          code: httpStatus.UNAUTHORIZED,
          message: 'Unauthorized request',
          userId: null
        }
      }
      if (!await user.verifyPassword(password)) {
        return {
          status: 'failed',
          code: httpStatus.UNAUTHORIZED,
          message: 'Invalid username or password in auth header',
          userId: null
        }
      }
      return {
        status: 'success',
        code: httpStatus.OK,
        message: '',
        userId: user.id,
      }
    } catch (error) {
      logger.error('Error authenticating user', {error});
      return {
        status: 'error',
        code: httpStatus.INTERNAL_SERVER_ERROR,
        message: httpStatus['500'],
        userId: null
      }
    }
  }
}
