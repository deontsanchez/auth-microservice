import request from 'supertest';
import mongoose from 'mongoose';
import express, { Express } from 'express';
import authRoutes from '../src/routes/authRoutes';
import User from '../src/models/User';
import { errorHandler } from '../src/middlewares/error';

// Mock RabbitMQ publish function
jest.mock('../src/config/rabbitmq', () => ({
  publishMessage: jest.fn(),
  getChannel: jest.fn(),
  connectRabbitMQ: jest.fn(),
}));

// Create a test app
const app: Express = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

// Test user data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
};

// Connect to a test database before running tests
beforeAll(async () => {
  const url =
    process.env.MONGODB_URI || 'mongodb://localhost:27017/auth-service-test';
  await mongoose.connect(url);
});

// Clean up after tests
afterAll(async () => {
  await User.deleteMany({});
  await mongoose.connection.close();
});

describe('Authentication Endpoints', () => {
  // Clear users collection before each test
  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('should register a new user', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user).toHaveProperty('email', testUser.email);
  });

  it('should not register a user with the same email', async () => {
    // First register a user
    await request(app).post('/api/auth/register').send(testUser);

    // Try to register again with the same email
    const res = await request(app).post('/api/auth/register').send(testUser);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('message', 'User already exists');
  });

  it('should login an existing user', async () => {
    // First register a user
    await request(app).post('/api/auth/register').send(testUser);

    // Login with that user
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user).toHaveProperty('email', testUser.email);
  });

  it('should not login with incorrect password', async () => {
    // First register a user
    await request(app).post('/api/auth/register').send(testUser);

    // Try to login with wrong password
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: 'wrongpassword',
    });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('success', false);
  });
});
