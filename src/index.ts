import express, { Request, Response } from 'express';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import connectDB from './config/database';
import { connectRabbitMQ } from './config/rabbitmq';
import { errorHandler, notFound } from './middlewares/error';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import { globalLimiter } from './middlewares/rateLimiter';
import { generateCsrfToken, validateCsrfToken } from './middlewares/csrf';
import { env } from './config/env';

// Initialize Express
const app = express();

// Connect to MongoDB
connectDB();

// Connect to RabbitMQ (handle gracefully in development)
try {
  connectRabbitMQ();
} catch (error) {
  console.error(
    'RabbitMQ connection failed (continuing anyway for local development)'
  );
  console.error(error instanceof Error ? error.message : 'Unknown error');
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());
app.use(helmet());

// Set up session
app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// Apply global rate limiter if enabled
if (env.ENABLE_RATE_LIMIT) {
  app.use(globalLimiter);
}

// Set up CSRF protection if enabled
if (env.ENABLE_CSRF) {
  app.use(generateCsrfToken);
  // Apply CSRF protection to all non-GET, non-HEAD, non-OPTIONS routes
  app.use((req, res, next) => {
    if (
      req.method !== 'GET' &&
      req.method !== 'HEAD' &&
      req.method !== 'OPTIONS'
    ) {
      validateCsrfToken(req, res, next);
    } else {
      next();
    }
  });

  // CSRF token endpoint for SPA clients
  app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: res.locals.csrfToken });
  });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'auth-microservice',
    environment: env.NODE_ENV,
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
});
