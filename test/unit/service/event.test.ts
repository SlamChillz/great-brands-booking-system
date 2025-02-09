import EventService from '../../../src/services/event';
import EventRepository from '../../../src/repository/event';
import { BookingStatus } from '../../../src/enum';
import httpStatus from 'http-status';
import { logger } from '../../../src/utils/logger';
import * as dbError from '../../../src/error/db';
import { cache } from '../../../src/cache';
import { Booking, Event, Waitlist } from '../../../src/database/entity';
import { randomUUID } from 'node:crypto';
import { TInitializeEvent } from '../../../src/types';

// Mock dependencies
jest.mock('../../../src/database', () => ({
  db: {
    client: {
      getRepository: jest.fn()
    }
  }
}));
jest.mock('../../../src/repository/event');
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/cache');

describe('EventService', () => {
  let eventService: EventService;
  let createMock: jest.SpyInstance<Promise<Event>, [payload: Omit<TInitializeEvent, "id">]>
  let bookMock: jest.SpyInstance<
		Promise<
			| { status: BookingStatus; data: null; error: Error }
			| { status: BookingStatus; data: Booking; error: null }
			| { status: BookingStatus; data: Waitlist; error: null }
		>,
		[userId: string, eventId: string]
	>;
  let cancelMock: jest.SpyInstance<
		Promise<{ status: BookingStatus; newBooking: Booking | null; error: Error | null }>,
		[userId: string, bookId: string]
	>;
  let statusMock: jest.SpyInstance<Promise<Event | null>, [eventId: string]>;
  let bookingsMock: jest.SpyInstance<
		Promise<{ data: Booking[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>,
		[eventId: string, page: number, limit: number]
	>;
  let waitlistsMock: jest.SpyInstance<
		Promise<{ data: Waitlist[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>,
		[eventId: string, page: number, limit: number]
	>;

  beforeEach(() => {
    eventService = new EventService();
    jest.clearAllMocks();
    createMock = jest.spyOn(EventRepository, 'create')
    bookMock = jest.spyOn(EventRepository, 'book')
    cancelMock = jest.spyOn(EventRepository, 'cancel')
    statusMock = jest.spyOn(EventRepository, 'status')
    bookingsMock = jest.spyOn(EventRepository, 'bookings')
    waitlistsMock = jest.spyOn(EventRepository, 'waitlists')
  });

  describe('initialize', () => {
    const payload = { name: 'Test Event', no_tickets: 100 };
    it('should create an event successfully', async () => {
      const event = new Event()
      event.name = payload.name;
      event.total_tickets = payload.no_tickets
      event.available_tickets = payload.no_tickets
      event.created_at = new Date()
      event.updated_at = new Date()
      createMock.mockResolvedValue(event);

      const result = await eventService.initialize(payload);

      expect(createMock).toHaveBeenCalledWith(payload);
      expect(result).toEqual({
        status: 'success',
        code: httpStatus.CREATED,
        message: 'Event created',
        data: { event },
      });
    });

    it('should handle errors when creating an event', async () => {
      const payload = { name: 'Test Event', no_tickets: 100 };
      createMock.mockRejectedValue(new Error('Database error'));

      const result = await eventService.initialize(payload);

      expect(logger.error).toHaveBeenCalledWith('Error creating event', {
        error: expect.any(Error),
      });
      expect(result).toEqual({
        status: 'error',
        code: httpStatus.INTERNAL_SERVER_ERROR,
        message: httpStatus['500'],
        error: {},
      });
    });
  });

  describe('book', () => {
    it('should book an event successfully', async () => {
      const userId = 'user123';
      const eventId = 'event123';
      const booking = new Booking()
      const bookingData = { status: BookingStatus.BOOKED, data: booking, error: null};
      bookMock.mockResolvedValue(bookingData);

      const result = await eventService.book(userId, eventId);

      expect(bookMock).toHaveBeenCalledWith(userId, eventId);
      expect(result).toEqual({
        status: 'success',
        code: httpStatus.CREATED,
        message: 'Event booked',
        data: { booking: bookingData.data, waitList: null },
      });
    });

    it('should add to waitlist if event is full', async () => {
      const userId = randomUUID();
      const eventId = randomUUID();
      const waitlistData = { status: BookingStatus.WAITING, data: new Booking(), error: null };
      bookMock.mockResolvedValue(waitlistData);

      const result = await eventService.book(userId, eventId);

      expect(bookMock).toHaveBeenCalledWith(userId, eventId);
      expect(result).toEqual({
        status: 'success',
        code: httpStatus.CREATED,
        message: 'Added to event wait list',
        data: { booking: null, waitList: waitlistData.data },
      });
    });

    it('should handle event not found error', async () => {
      const userId = randomUUID();
      const eventId = randomUUID();
      bookMock.mockResolvedValue({
        status: BookingStatus.FAILED,
        error: new Error(dbError.EVENT_NOT_FOUND),
        data: null
      });
      const result = await eventService.book(userId, eventId);

      expect(result).toEqual({
        status: 'failed',
        code: httpStatus.BAD_REQUEST,
        message: 'Event not found',
        error: { eventId: 'Does not exist' },
      });
    });

    it('should handle database errors', async () => {
      const userId = 'user123';
      const eventId = 'event123';
      bookMock.mockRejectedValue(new Error('Database error'));
      const result = await eventService.book(userId, eventId);

      expect(logger.error).toHaveBeenCalledWith('Error booking event', {
        error: expect.any(Error),
      });
      expect(result).toEqual({
        status: 'error',
        code: httpStatus.INTERNAL_SERVER_ERROR,
        message: httpStatus['500'],
        error: {},
      });
    });
  });

  describe('cancel', () => {
    it('should cancel a booking successfully', async () => {
      const userId = randomUUID();
      const bookId = randomUUID();
      const mockReturnData = {
        status: BookingStatus.CANCELLED,
        newBooking: new Booking(),
        error: null,
      }
      cancelMock.mockResolvedValue(mockReturnData);

      const result = await eventService.cancel(userId, bookId);

      expect(cancelMock).toHaveBeenCalledWith(userId, bookId);
      expect(result).toEqual({
        status: 'success',
        code: httpStatus.OK,
        message: 'Booking cancelled. Ticket assigned to a user on the wait list',
        data: {},
      });
    });

    it('should handle booking not found error', async () => {
      const userId = randomUUID();
      const bookId = randomUUID();
      cancelMock.mockResolvedValue({
        status: BookingStatus.FAILED,
        error: new Error(dbError.BOOKING_NOT_FOUND_FOR_USER),
        newBooking: null,
      });

      const result = await eventService.cancel(userId, bookId);

      expect(result).toEqual({
        status: 'failed',
        code: httpStatus.FORBIDDEN,
        message: 'You can only cancel bookings you created',
        error: {},
      });
    });

    it('should handle database errors', async () => {
      const userId = 'user123';
      const bookId = 'booking123';
      cancelMock.mockRejectedValue(new Error('Database error'));

      const result = await eventService.cancel(userId, bookId);

      expect(logger.error).toHaveBeenCalledWith('Error cancelling booking', {
        error: expect.any(Error),
      });
      expect(result).toEqual({
        status: 'error',
        code: httpStatus.INTERNAL_SERVER_ERROR,
        message: httpStatus['500'],
        error: {},
      });
    });
  });

  describe('status', () => {
    it('should retrieve event status from cache', async () => {
      const eventId = 'event123';
      const cachedStatus = { status: 'active' };
      (cache.retrieveEvent as jest.Mock).mockReturnValue(cachedStatus);

      const result = await eventService.status(eventId);

      expect(cache.retrieveEvent).toHaveBeenCalledWith(eventId);
      expect(result).toEqual({
        status: 'success',
        code: httpStatus.OK,
        message: 'Event status retrieved',
        data: cachedStatus,
      });
    });

    it('should retrieve event status from database if cache miss', async () => {
      const eventId = randomUUID();
      // const dbStatus = { status: 'active' };
      const event = new Event();
      (cache.retrieveEvent as jest.Mock).mockReturnValue(null);
      statusMock.mockResolvedValue(event);

      const result = await eventService.status(eventId);

      expect(statusMock).toHaveBeenCalledWith(eventId);
      expect(result).toEqual({
        status: 'success',
        code: httpStatus.OK,
        message: 'Event status retrieved',
        data: event,
      });
    });

    it('should handle event not found error', async () => {
      const eventId = 'event123';
      (cache.retrieveEvent as jest.Mock).mockReturnValue(null);
      statusMock.mockResolvedValue(null);

      const result = await eventService.status(eventId);

      expect(result).toEqual({
        status: 'failed',
        code: httpStatus.NOT_FOUND,
        message: 'Event not found',
        error: { eventId: 'Does not exist' },
      });
    });

    it('should handle database errors', async () => {
      const eventId = 'event123';
      (cache.retrieveEvent as jest.Mock).mockReturnValue(null);
      statusMock.mockRejectedValue(new Error('Database error'));

      const result = await eventService.status(eventId);

      expect(logger.error).toHaveBeenCalledWith('Error retrieving event status', {
        error: expect.any(Error),
      });
      expect(result).toEqual({
        status: 'error',
        code: httpStatus.INTERNAL_SERVER_ERROR,
        message: httpStatus['500'],
        error: {},
      });
    });
  });

  describe('bookings', () => {
    it('should retrieve bookings for an event', async () => {
      const queryData = { eventId: 'event123', page: 1, limit: 10 };
      const bookings = [new Booking(), new Booking()];
      const mockReturnData = {data: bookings, pagination: {total: 2, page: 1, limit: 10, totalPages: 1}}
      bookingsMock.mockResolvedValue(mockReturnData);

      const result = await eventService.bookings(queryData);

      expect(bookingsMock).toHaveBeenCalledWith(queryData.eventId, queryData.page, queryData.limit);
      expect(result).toEqual({
        status: 'success',
        code: httpStatus.OK,
        message: 'All bookings retrieved',
        data: mockReturnData,
      });
    });
  });

  describe('waitlists', () => {
    it('should retrieve waitlists for an event', async () => {
      const queryData = { eventId: 'event123', page: 1, limit: 10 };
      const waitlists = [new Waitlist(), new Waitlist()];
      const mockReturnData = {data: waitlists, pagination: {total: 2, page: 1, limit: 10, totalPages: 1}}
      waitlistsMock.mockResolvedValue(mockReturnData);

      const result = await eventService.waitlists(queryData);

      expect(waitlistsMock).toHaveBeenCalledWith(queryData.eventId, queryData.page, queryData.limit);
      expect(result).toEqual({
        status: 'success',
        code: httpStatus.OK,
        message: 'All waitlist retrieved',
        data: mockReturnData,
      });
    });
  });
});
