import request from 'supertest';
import { Express } from 'express';
import { EventService, UserService } from '../../../src/services';
import httpStatus from 'http-status';
import { default as AppServer} from '../../../src/app';
import { randomUUID } from 'node:crypto';

// Mock the EventService and logger
jest.mock('../../../src/services');
jest.mock('../../../src/utils/logger');

describe('EventController - Integration Tests', () => {
  let app: Express;
  let server: AppServer
  const userId = randomUUID();
  const initRoute = '/api/v1/initialize'

  beforeAll(async () => {
    server = new AppServer('latest')
    await server.bootstrap()
    app = server.restApp
  });

  afterAll(async () => {
    await server.shutdown()
  })

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/initialize', () => {
    it('should initialize an event successfully', async () => {
      (UserService.authenticate as jest.Mock).mockResolvedValue({
        status: 'success',
        code: 200,
        message: 'success',
        userId
      })
      const mockResult = {
        status: 'success',
        code: httpStatus.CREATED,
        message: 'Event initialized successfully.',
        data: { event: { id: randomUUID(), name: 'test event', no_tickets: 100 } },
      };
      (EventService.initialize as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .post(initRoute)
        .set('Authorization', `Basic user:password`)
        .send({ name: 'Test Event', no_tickets: 100 });

      expect(response.status).toBe(httpStatus.CREATED);
      expect(response.body).toEqual(mockResult);
    });

    it('should return 401 for invalid input', async () => {
      (UserService.authenticate as jest.Mock).mockResolvedValue({
        status: 'success',
        code: 200,
        message: 'success',
        userId
      })
      const response = await request(app)
        .post(initRoute)
        .set('Authorization', `Bearer user:password`)
        .send({ name: '', no_tickets: 0 });

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 422 for invalid input', async () => {
      (UserService.authenticate as jest.Mock).mockResolvedValue({
        status: 'success',
        code: 200,
        message: 'success',
        userId
      })
      const response = await request(app)
        .post(initRoute)
        .set('Authorization', `Basic user:password`)
        .send({ name: '', no_tickets: 0 });

      expect(response.status).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 500 for error', async () => {
      (UserService.authenticate as jest.Mock).mockResolvedValue({
        status: 'success',
        code: 200,
        message: 'success',
        userId
      });
      (EventService.initialize as jest.Mock).mockResolvedValue(new Error('server error'));

      const response = await request(app)
        .post(initRoute)
        .set('Authorization', `Basic user:password`)
        .send({ name: 'Test Event', no_tickets: 100 });

      expect(response.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/book', () => {
    const eventId = randomUUID();
    it('should book an event successfully', async () => {
      (UserService.authenticate as jest.Mock).mockResolvedValue({
        status: 'success',
        code: 200,
        message: 'success',
        userId
      })
      const mockResult = {
        status: 'success',
        code: httpStatus.OK,
        message: 'Event booked successfully.',
        data: { booking: { id: 'booking-1', userId: 'user-1', eventId: 'event-1' } },
      };
      (EventService.book as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/v1/book')
        .set('Authorization', 'Basic dGVzdHVzZXI6cGFzc3dvcmQxMjM=') // Mock auth header
        .send({ eventId: eventId });

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual(mockResult);
    });

    it('should return 422 for invalid input', async () => {
      (UserService.authenticate as jest.Mock).mockResolvedValue({
        status: 'success',
        code: 200,
        message: 'success',
        userId
      })
      const response = await request(app)
        .post('/api/v1/book')
        .set('Authorization', 'Basic dGVzdHVzZXI6cGFzc3dvcmQxMjM=')
        .send({ eventId: '' });

      expect(response.status).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 500 for server errors', async () => {
      (UserService.authenticate as jest.Mock).mockResolvedValue({
        status: 'success',
        code: 200,
        message: 'success',
        userId
      })
      const mockError = new Error('Booking failed');
      (EventService.book as jest.Mock).mockRejectedValue(mockError);

      const response = await request(app)
        .post('/api/v1/book')
        .set('Authorization', 'Basic dGVzdHVzZXI6cGFzc3dvcmQxMjM=')
        .send({ eventId: eventId });

      expect(response.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/cancel', () => {
    const bookId = randomUUID();
    const eventId = randomUUID();
    it('should cancel a booking successfully', async () => {
      (UserService.authenticate as jest.Mock).mockResolvedValue({
        status: 'success',
        code: 200,
        message: 'success',
        userId
      });
      const mockResult = {
        status: 'success',
        code: httpStatus.OK,
        message: 'Booking canceled successfully.',
        data: { booking: { id: bookId, userId: userId, eventId: eventId } },
      };
      (EventService.cancel as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/v1/cancel')
        .set('Authorization', 'Basic dGVzdHVzZXI6cGFzc3dvcmQxMjM=')
        .send({ bookId: bookId });

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toHaveProperty('data');
    });

    it('should return 422 for invalid input', async () => {
      (UserService.authenticate as jest.Mock).mockResolvedValue({
        status: 'success',
        code: 200,
        message: 'success',
        userId
      });
      const response = await request(app)
        .post('/api/v1/cancel')
        .set('Authorization', 'Basic dGVzdHVzZXI6cGFzc3dvcmQxMjM=')
        .send({ bookId: '' });

      expect(response.status).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 500 for server errors', async () => {
      (UserService.authenticate as jest.Mock).mockResolvedValue({
        status: 'success',
        code: 200,
        message: 'success',
        userId
      })
      const mockError = new Error('Booking cancellation failed');
      (EventService.cancel as jest.Mock).mockRejectedValue(mockError);

      const response = await request(app)
        .post('/api/v1/cancel')
        .set('Authorization', 'Basic dGVzdHVzZXI6cGFzc3dvcmQxMjM=')
        .send({ bookId });

      expect(response.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /v1/status/:eventId', () => {
    it('should fetch event status successfully', async () => {
      const mockResult = {
        status: 'success',
        code: httpStatus.OK,
        message: 'Event status fetched successfully.',
        data: { event: { id: 'event-1', name: 'Test Event', available_tickets: 50 } },
      };
      (EventService.status as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app).get('/api/v1/status/' + randomUUID());
      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toHaveProperty('data');
    });

    it('should return 422 for invalid eventId', async () => {
      const response = await request(app).get('/api/v1/status/1')

      expect(response.status).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 500 for server errors', async () => {
      (UserService.authenticate as jest.Mock).mockResolvedValue({
        status: 'success',
        code: 200,
        message: 'success',
        userId
      })
      const mockError = new Error('Fetch event status failed');
      (EventService.status as jest.Mock).mockRejectedValue(mockError);

      const response = await request(app)
        .get('/api/v1/status/' + randomUUID())
        .set('Authorization', 'Basic dGVzdHVzZXI6cGFzc3dvcmQxMjM=')

      expect(response.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /v1/events/:eventId/bookings', () => {
    const eventId = randomUUID();
    const bookId = randomUUID();
    const userId = randomUUID();
    it('should fetch bookings for an event successfully', async () => {
      (UserService.authenticate as jest.Mock).mockResolvedValue({
        status: 'success',
        code: 200,
        message: 'success',
        userId
      });
      const mockResult = {
        status: 'success',
        code: httpStatus.OK,
        message: 'Bookings fetched successfully.',
        data: { bookings: [{ id: bookId, userId: userId, eventId: eventId }] },
      };
      (EventService.bookings as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .get(`/api/v1/events/${eventId}/bookings`)
        .set('Authorization', 'Basic dGVzdHVzZXI6cGFzc3dvcmQxMjM=')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toHaveProperty('data');
    });

    it('should return 422 for invalid input', async () => {
      (UserService.authenticate as jest.Mock).mockResolvedValue({
        status: 'success',
        code: 200,
        message: 'success',
        userId
      });
      const response = await request(app)
        .get('/api/v1/events/1/bookings')
        .set('Authorization', 'Basic dGVzdHVzZXI6cGFzc3dvcmQxMjM=')
        .query({ page: 0, limit: 0 });

      expect(response.status).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 500 for server errors', async () => {
      (UserService.authenticate as jest.Mock).mockResolvedValue({
        status: 'success',
        code: 200,
        message: 'success',
        userId
      })
      const mockError = new Error('Fetch bookings failed');
      (EventService.bookings as jest.Mock).mockRejectedValue(mockError);

      const response = await request(app)
        .get(`/api/v1/events/${eventId}/bookings`)
        .set('Authorization', 'Basic dGVzdHVzZXI6cGFzc3dvcmQxMjM=')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /v1/events/:eventId/waitlists', () => {
    const eventId = randomUUID();
    const waitId = randomUUID();
    const userId = randomUUID();
    it('should fetch waitlists for an event successfully', async () => {
      (UserService.authenticate as jest.Mock).mockResolvedValue({
        status: 'success',
        code: 200,
        message: 'success',
        userId
      });
      const mockResult = {
        status: 'success',
        code: httpStatus.OK,
        message: 'Waitlists fetched successfully.',
        data: { waitlists: [{ id: waitId, userId: userId, eventId: eventId }] },
      };
      (EventService.waitlists as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .get(`/api/v1/events/${eventId}/waitlists`)
        .set('Authorization', 'Basic dGVzdHVzZXI6cGFzc3dvcmQxMjM=')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual(mockResult);
    });

    it('should return 422 for invalid input', async () => {
      (UserService.authenticate as jest.Mock).mockResolvedValue({
        status: 'success',
        code: 200,
        message: 'success',
        userId
      });
      const response = await request(app)
        .get('/api/v1/events/1/waitlists')
        .set('Authorization', 'Basic dGVzdHVzZXI6cGFzc3dvcmQxMjM=') // Mock auth header
        .query({ page: 0, limit: 0 });

      expect(response.status).toBe(httpStatus.UNPROCESSABLE_ENTITY);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 500 for server errors', async () => {
      (UserService.authenticate as jest.Mock).mockResolvedValue({
        status: 'success',
        code: 200,
        message: 'success',
        userId
      })
      const mockError = new Error('Fetch waitlist failed');
      (EventService.waitlists as jest.Mock).mockRejectedValue(mockError);

      const response = await request(app)
        .get(`/api/v1/events/${eventId}/waitlists`)
        .set('Authorization', 'Basic dGVzdHVzZXI6cGFzc3dvcmQxMjM=')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
      expect(response.body).toHaveProperty('error');
    });
  });
});
