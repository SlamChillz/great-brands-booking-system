import request from 'supertest';
import { Express } from 'express';
import { UserService } from '../../../src/services';
import { logger } from '../../../src/utils/logger';
import { default as AppServer} from '../../../src/app';
import { randomUUID } from 'node:crypto';
import httpStatus from 'http-status';

// Mock the UserService and logger
jest.mock('../../../src/services');
jest.mock('../../../src/utils/logger');

describe('UserController - Integration Tests', () => {
  let app: Express;
  let server: AppServer
  const endPoint = '/api/v1/users'

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

  it('should create a user successfully', async () => {
    const mockResult = {
      status: 'success',
      code: 201,
      message: 'User created successfully.',
      data: { user: { id: randomUUID(), username: 'testuser' } },
    };
    (UserService.create as jest.Mock).mockResolvedValue(mockResult);

    const response = await request(app)
      .post(endPoint)
      .send({ username: 'testuser', password: 'password123' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(mockResult);
    expect(UserService.create).toHaveBeenCalledWith({
      username: 'testuser',
      password: 'password123',
    });
  });

  it('should return 422 for invalid input', async () => {
    const response = await request(app)
      .post(endPoint)
      .send({ username: '', password: '' });

    // Assertions
    expect(response.status).toBe(httpStatus.UNPROCESSABLE_ENTITY);
    expect(response.body).toHaveProperty('error');
    expect(UserService.create).not.toHaveBeenCalled();
  });

  it('should return 500 for server errors', async () => {
    const mockError = new Error('User creation failed');
    (UserService.create as jest.Mock).mockRejectedValue(mockError);

    const response = await request(app)
      .post(endPoint)
      .send({ username: 'testuser', password: 'password123' });

    expect(response.status).toBe(500);
    expect(logger.error).toHaveBeenCalledWith(
      'User controller errored while creating user',
      mockError,
    );
  });
});
