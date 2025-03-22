import { cleanEnv, str, port, url, bool } from 'envalid';

export const env = cleanEnv(process.env, {
  // Server
  NODE_ENV: str({
    choices: ['development', 'test', 'production'],
    default: 'development',
  }),
  PORT: port({ default: 3000 }),

  // Database
  MONGODB_URI: url({
    desc: 'MongoDB connection string',
    example: 'mongodb://localhost:27017/auth-service',
  }),

  // Authentication
  JWT_SECRET: str({
    desc: 'Secret key for JWT token generation',
    example: 'your_jwt_secret_key_here',
  }),
  JWT_EXPIRES_IN: str({ default: '1d' }),

  // Session
  SESSION_SECRET: str({
    desc: 'Secret key for session',
    example: 'your_session_secret_key_here',
  }),

  // RabbitMQ
  RABBITMQ_URL: url({
    desc: 'RabbitMQ connection string',
    example: 'amqp://localhost:5672',
    default: 'amqp://localhost:5672',
  }),

  // Security
  ENABLE_RATE_LIMIT: bool({ default: true }),
  ENABLE_CSRF: bool({ default: true }),
});
