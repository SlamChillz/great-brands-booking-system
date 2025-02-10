import { BookingStatus, ServiceCart } from '../enum';
import EventRepository from '../repository/event';
import { TInitializeEvent } from '../types';
import httpStatus from 'http-status';
import { logger } from '../utils/logger';
import * as dbError from '../error/db';
import {cache} from '../cache';

export default class EventService {
	private name = ServiceCart.EVENT;

	public async initialize(payload: Omit<TInitializeEvent, 'id'>) {
		try {
			const event = await EventRepository.create(payload);
			logger.info(`Event created: ${event.id}`);
			return {
				status: 'success',
        code: httpStatus.CREATED,
				message: 'Event created',
				data: { event }
			};
		} catch (error: unknown) {
      if (JSON.stringify(error).includes('23505')) {
        return {
          status: 'failed',
          code: httpStatus.CONFLICT,
          message: httpStatus['409'],
          error: {
            username: 'event name already exists',
          },
        }
      }
			logger.error('Error creating event', { error });
      return {
        status: 'error',
        code: httpStatus.INTERNAL_SERVER_ERROR,
        message: httpStatus['500'],
        error: {},
      }
		}
	}

	public async book(userId: string, eventId: string) {
		try {
			const booking = await EventRepository.book(userId, eventId);
			if (booking.error && booking.error.message === dbError.EVENT_NOT_FOUND) {
				return {
					status: 'failed',
          code: httpStatus.BAD_REQUEST,
					message: 'Event not found',
					error: {
						eventId: 'Does not exist'
					}
				};
			}
			return {
				status: 'success',
        code: httpStatus.CREATED,
				message: booking.status === BookingStatus.BOOKED ? 'Event booked' : 'Added to event wait list',
        data: {
          booking: booking.status === BookingStatus.BOOKED ? booking.data : null,
          waitList: booking.status === BookingStatus.BOOKED ? null : booking.data,
        }
			};
		} catch (error) {
      logger.error('Error booking event', { error });
      return {
        status: 'error',
        code: httpStatus.INTERNAL_SERVER_ERROR,
        message: httpStatus['500'],
        error: {}
      };
    }
	}

  public async cancel(userId: string, bookId: string) {
    try {
      const result = await EventRepository.cancel(userId, bookId);
      if (result.error) {
        if (result.error.message === dbError.BOOKING_NOT_FOUND_FOR_USER) {
          return {
            status: 'failed',
            code: httpStatus.FORBIDDEN,
            message: 'You can only cancel bookings you created',
            error: {}
          }
        }
        return {
          status: 'failed',
          code: httpStatus.NOT_FOUND,
          message: 'Booking not found',
          error: {}
        }
      }
      return {
        status: 'success',
        code: httpStatus.OK,
        message: result.newBooking === null ? 'Booking cancelled. Ticket added back to the pool' : 'Booking cancelled. Ticket assigned to a user on the wait list',
        data: {},
      }
    } catch (error) {
      logger.error('Error cancelling booking', { error });
      return {
        status: 'error',
        code: httpStatus.INTERNAL_SERVER_ERROR,
        message: httpStatus['500'],
        error: {}
      };
    }
  }

  public async status(eventId: string) {
    try {
      const eventStatusFromCache = cache.retrieveEvent(eventId);
      if (!eventStatusFromCache) {
        logger.info('Cache miss', { eventId });
        const eventStatusFromDb = await EventRepository.status(eventId);
        if (!eventStatusFromDb) {
          return {
            status: 'failed',
            code: httpStatus.NOT_FOUND,
            message: 'Event not found',
            error: {
              eventId: 'Does not exist',
            }
          }
        }
        return {
          status: 'success',
          code: httpStatus.OK,
          message: 'Event status retrieved',
          data: eventStatusFromDb
        }
      }
      logger.info('Cache hit')
      return {
        status: 'success',
        code: httpStatus.OK,
        message: 'Event status retrieved',
        data: eventStatusFromCache,
      }
    } catch (error) {
      logger.error('Error retrieving event status', { error });
      return {
        status: 'error',
        code: httpStatus.INTERNAL_SERVER_ERROR,
        message: httpStatus['500'],
        error: {}
      };
    }
  }

  public async bookings(queryData: {eventId: string, page: number, limit: number }) {
    const { eventId, page, limit } = queryData;
    const result = await EventRepository.bookings(eventId, page, limit);
    return {
      status: 'success',
      code: httpStatus.OK,
      message: 'All bookings retrieved',
      data: result,
    }
  }

  public async waitlists(queryData: {eventId: string, page: number, limit: number }) {
    const { eventId, page, limit } = queryData;
    const result = await EventRepository.waitlists(eventId, page, limit);
    return {
      status: 'success',
      code: httpStatus.OK,
      message: 'All waitlist retrieved',
      data: result,
    }
  }
}
