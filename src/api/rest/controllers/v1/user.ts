import { Request, Response, NextFunction } from 'express';
import { UserService } from '../../../../services';
import { logger } from '../../../../utils/logger';
import {createUserSchema} from '../../validation/user';
import httpStatus from 'http-status';

export class UserController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      const { error, value: payload } = createUserSchema.validate({username: username, password: password}, { abortEarly: false });
      if (error) return next(error);
      payload.username = payload.username.toLowerCase();
      const result = await UserService.create(payload);
      res.status(result.code).json(result);
    } catch (error) {
      logger.error('User controller errored while creating user', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: httpStatus['500'],
        error: error,
      })
    }
  }
}
