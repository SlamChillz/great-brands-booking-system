import request from 'supertest';
import express, { Express } from 'express';
import { authMiddy } from '../../../src/api/rest/middlewares';
import { UserService } from '../../../src/services';
import httpStatus from 'http-status';
import { randomUUID } from 'node:crypto';

// Mock the UserService and logger
jest.mock('../../../src/services');
jest.mock('../../../src/utils/logger');

describe('authMiddy - Integration Tests', () => {
  let app: Express;
  const route = '/api/v1/protected'

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(authMiddy);
    app.get(route, (req, res) => {
      res.status(200).json({ message: 'Protected route', userId: req.headers['userId'] });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks(); // Clear all mocks before each test
  });

  it('should return 401 if Authorization header is missing', async () => {
    const response = await request(app).get(route);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    expect(response.body).toEqual({
      status: 'failed',
      message: 'Missing or invalid Authorization header',
      error: {},
    });
  });

  it('should return 401 if authentication fails', async () => {
    (UserService.authenticate as jest.Mock).mockResolvedValue({
      status: 'failed',
      code: httpStatus.UNAUTHORIZED,
      message: 'Unauthorized request',
      userId: null,
    });
    const response = await request(app)
      .get(route)
      .set('Authorization', 'Basic dGVzdHVzZXI6cGFzc3dvcmQxMjM='); // Base64 for 'testuser:password123'

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    expect(response.body).toEqual({
      status: 'failed',
      message: 'Unauthorized request',
      error: {},
    });
  });

  it('should set userId in headers and proceed to the next middleware if authentication succeeds', async () => {
    const userId = randomUUID();
    (UserService.authenticate as jest.Mock).mockResolvedValue({
      status: 'success',
      code: httpStatus.OK,
      message: '',
      userId: userId,
    });

    const response = await request(app)
      .get(route)
      .set('Authorization', 'Basic dGVzdHVzZXI6cGFzc3dvcmQxMjM='); // Base64 for 'testuser:password123'

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toEqual({
      message: 'Protected route',
      userId: userId,
    });
  });

  it('should return 500 if authentication throws an error', async () => {
    const mockError = new Error('Authentication failed');
    (UserService.authenticate as jest.Mock).mockRejectedValue(mockError);

    const response = await request(app)
      .get(route)
      .set('Authorization', 'Basic dGVzdHVzZXI6cGFzc3dvcmQxMjM=');

    expect(response.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
    expect(response.body).toEqual({
      status: 'error',
      message: httpStatus['500'],
      error: {},
    });
  });
});
