import { Request, Response, NextFunction } from 'express';
import { Result, ValidationError } from 'express-validator';
import {
  ApiError,
  ValidationError as AppValidationError,
} from '../utils/errors';

// 404 handler - Not Found
export const notFound = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Error handler middleware
export const errorHandler = (
  err: Error | Result<ValidationError>,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error in development
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  // Handle API errors with appropriate status code
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err instanceof AppValidationError && { errors: err.errors }),
    });
    return;
  }

  // Handle express-validator errors
  if (Array.isArray(err)) {
    const validationErrors: Record<string, string> = {};

    for (const error of err) {
      if ('param' in error && 'msg' in error) {
        validationErrors[error.param as string] = error.msg as string;
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
      });
      return;
    }
  }

  // Default to 500 server error
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err instanceof Error ? err.message : 'Internal Server Error',
    stack:
      process.env.NODE_ENV !== 'production' && err instanceof Error
        ? err.stack
        : undefined,
  });
};
