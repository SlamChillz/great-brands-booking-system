import { NextFunction, Request, Response } from 'express';
import { EventController } from '../../../src/api/rest/controllers/v1';
import { EventService } from '../../../src/services';
import httpStatus from 'http-status';

jest.mock('../../../src/services'); // Mock EventService

describe('EventController', () => {
	let eventController: EventController;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let mockNext: NextFunction;

	beforeEach(() => {
		eventController = new EventController();
		mockRequest = {};
		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn()
		};
		mockNext = jest.fn();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('initialize', () => {
		it('should initialize an event successfully', async () => {
			mockRequest.body = { name: 'test event', no_tickets: 100 };

			const mockResult = { code: httpStatus.CREATED, message: 'Event created' };
			(EventService.initialize as jest.Mock).mockResolvedValue(mockResult);

			await eventController.initialize(mockRequest as Request, mockResponse as Response, mockNext);

			expect(EventService.initialize).toHaveBeenCalledWith({
				name: 'test event',
				no_tickets: 100
			});
			expect(mockResponse.status).toHaveBeenCalledWith(httpStatus.CREATED);
			expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
		});

		it('should handle validation errors', async () => {
			// Invalid name (min length 3)
			mockRequest.body = { name: 'te', no_tickets: 100 };

			await eventController.initialize(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
		});
	});

	describe('book', () => {
		it('should book an event successfully', async () => {
			mockRequest.body = { eventId: '123e4567-e89b-12d3-a456-426614174000' };
			mockRequest.headers = { userId: 'user123' };

			const mockResult = { code: httpStatus.OK, message: 'Event booked' };
			(EventService.book as jest.Mock).mockResolvedValue(mockResult);

			await eventController.book(mockRequest as Request, mockResponse as Response, mockNext);

			expect(EventService.book).toHaveBeenCalledWith('user123', '123e4567-e89b-12d3-a456-426614174000');
			expect(mockResponse.status).toHaveBeenCalledWith(httpStatus.OK);
			expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
		});
	});

	describe('cancel', () => {
		it('should cancel a booking successfully', async () => {
      mockRequest.body = { bookId: '123e4567-e89b-12d3-a456-426614174000' };
			mockRequest.headers = { userId: 'user123' };

			const mockResult = { code: httpStatus.OK, message: 'Booking canceled' };
			(EventService.cancel as jest.Mock).mockResolvedValue(mockResult);

			await eventController.cancel(mockRequest as Request, mockResponse as Response, mockNext);

			expect(EventService.cancel).toHaveBeenCalledWith('user123', '123e4567-e89b-12d3-a456-426614174000');
			expect(mockResponse.status).toHaveBeenCalledWith(httpStatus.OK);
			expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
		});
	});

	describe('status', () => {
		it('should fetch event status successfully', async () => {
			const eventId = '123e4567-e89b-12d3-a456-426614174000';
			mockRequest.params = { eventId };

			const mockResult = { code: httpStatus.OK, status: 'active' };
			(EventService.status as jest.Mock).mockResolvedValue(mockResult);

			await eventController.status(mockRequest as Request, mockResponse as Response, mockNext);

			expect(EventService.status).toHaveBeenCalledWith(eventId);
			expect(mockResponse.status).toHaveBeenCalledWith(httpStatus.OK);
			expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
		});
	});

	describe('bookings', () => {
		it('should fetch bookings for an event successfully', async () => {
			const eventId = '123e4567-e89b-12d3-a456-426614174000';
			const page = 1;
			const limit = 10;
			mockRequest.params = { eventId };
			mockRequest.query = { page: page.toString(), limit: limit.toString() };

			const mockResult = { code: httpStatus.OK, bookings: [] };
			(EventService.bookings as jest.Mock).mockResolvedValue(mockResult);

			await eventController.bookings(mockRequest as Request, mockResponse as Response, mockNext);

			expect(EventService.bookings).toHaveBeenCalledWith({
				eventId,
				page,
				limit
			});
			expect(mockResponse.status).toHaveBeenCalledWith(httpStatus.OK);
			expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
		});
	});

	describe('waitlists', () => {
		it('should fetch waitlists for an event successfully', async () => {
			const eventId = '123e4567-e89b-12d3-a456-426614174000';
			const page = 1;
			const limit = 10;
			mockRequest.params = { eventId };
			mockRequest.query = { page: page.toString(), limit: limit.toString() };

			const mockResult = { code: httpStatus.OK, waitlists: [] };
			(EventService.waitlists as jest.Mock).mockResolvedValue(mockResult);

			await eventController.waitlists(mockRequest as Request, mockResponse as Response, mockNext);

			expect(EventService.waitlists).toHaveBeenCalledWith({
				eventId,
				page,
				limit
			});
			expect(mockResponse.status).toHaveBeenCalledWith(httpStatus.OK);
			expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
		});
	});
});
