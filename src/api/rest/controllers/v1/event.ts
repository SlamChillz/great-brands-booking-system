import { Request, Response, NextFunction } from 'express';
import {EventService} from '../../../../services';
import { logger } from '../../../../utils/logger';
import {
  eventInitSchema,
  bookEventSchema,
  cancelBookingSchema,
  eventStatusSchema,
  listManySchema
} from '../../validation/event';
import httpStatus from 'http-status';

export class EventController {
  async initialize(req: Request, res: Response, next: NextFunction) {
    try {
      const { error, value: payload } = eventInitSchema.validate(req.body, {abortEarly: false});
      if (error) return next(error);
      payload.name = payload.name.toLowerCase();
      const result = await EventService.initialize(payload);
      res.status(result.code).json(result);
    } catch (error) {
      logger.error('Event controller errored while initializing an event', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: httpStatus['500'],
        error: error,
      })
    }
  }

  async book(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['userId'] as string;
      const { error, value: { eventId } } = bookEventSchema.validate(req.body, {abortEarly: false});
      if (error) return next(error);
      const result = await EventService.book(userId, eventId);
      res.status(result.code).json(result);
    } catch (error) {
      logger.error('controller errored while booking', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: httpStatus['500'],
        error: error,
      })
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['userId'] as string;
      const { error, value: { bookId } } = cancelBookingSchema.validate(req.body, {abortEarly: false});
      if (error) return next(error);
      const result = await EventService.cancel(userId, bookId);
      res.status(result.code).json(result);
    } catch (error) {
      logger.error('controller errored while canceling a booking', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: httpStatus['500'],
        error: error,
      })
    }
  }

  async status(req: Request, res: Response, next: NextFunction) {
    try {
      const { error, value: { eventId } } = eventStatusSchema.validate(req.params, {abortEarly: false});
      if (error) return next(error);
      const result = await EventService.status(eventId);
      res.status(result.code).json(result);
    } catch (error) {
      logger.error('controller errored while fetching event status', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: httpStatus['500'],
        error: error,
      })
    }
    return
  }

  async bookings(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const { page, limit } = req.query;
      const {error, value } = listManySchema.validate({ eventId, page, limit }, {abortEarly: false});
      if (error) return next(error);
      const result = await EventService.bookings(value)
      res.status(result.code).json(result);
    } catch (error) {
      logger.error('controller errored while fetching all bookings for an event', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: httpStatus['500'],
        error: error,
      })
    }
  }

  async waitlists(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;
      const { page, limit } = req.query;
      const {error, value } = listManySchema.validate({ eventId, page, limit }, {abortEarly: false});
      if (error) return next(error);
      const result = await EventService.waitlists(value)
      res.status(result.code).json(result);
    } catch (error) {
      logger.error('controller errored while fetching all bookings for an event', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: httpStatus['500'],
        error: error,
      })
    }
  }
}
