import { Request, Response, NextFunction } from 'express'
import httpStatus from 'http-status';
import {UserService} from '../../../services'
import { logger } from '../../../utils/logger';

export async function authMiddy(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      res.status(httpStatus.UNAUTHORIZED).json({
        status: 'failed',
        message: 'Missing or invalid Authorization header',
        error: {},
      });
      return;
    }
    const base64Credentials = authHeader.split(' ')[1];
    const decodedCredentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [providedUsername, providedPassword] = decodedCredentials.split(':');

    const auth = await UserService.authenticate(providedUsername, providedPassword);
    if (auth.status !== 'success') {
      res.status(auth.code).json({
        status: auth.status,
        message: auth.message,
        error: {}
      })
      return;
    }
    if (auth.userId !== null) {
      req.headers['userId'] = auth.userId;
    } else {
      logger.error('User is authenticated but missing userId');
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: httpStatus['500'],
        error: {}
      })
      return;
    }
    next();
  } catch (error) {
    logger.error('Error authenticating user', { error });
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: httpStatus['500'],
      error: {}
    })
  }
}
