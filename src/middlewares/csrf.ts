import { Request, Response, NextFunction } from 'express';
import Tokens from 'csrf';

// Extend express-session to include our CSRF secret
declare module 'express-session' {
  interface SessionData {
    csrfSecret?: string;
  }
}

const tokens = new Tokens();

// Generate a CSRF secret and token for the session
export const generateCsrfToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Create a CSRF secret if one doesn't exist
  if (!req.session.csrfSecret) {
    req.session.csrfSecret = tokens.secretSync();
  }

  // Generate a token from the secret
  const token = tokens.create(req.session.csrfSecret);

  // Set the token in res.locals so it can be included in rendered pages
  res.locals.csrfToken = token;

  // Also set it as a cookie for AJAX requests
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false, // Allows JavaScript to read the cookie
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });

  next();
};

// Validate the CSRF token from either headers or body
export const validateCsrfToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Skip CSRF validation for certain paths like health checks or options requests
  if (req.path === '/health' || req.method === 'OPTIONS') {
    next();
    return;
  }

  const secret = req.session.csrfSecret;
  if (!secret) {
    res.status(403).json({
      success: false,
      message: 'CSRF session secret is missing',
    });
    return;
  }

  // Get token from request header, body, or cookies
  let token =
    req.headers['x-csrf-token'] ||
    req.headers['x-xsrf-token'] ||
    req.body._csrf;

  // If token isn't in headers or body, try to get it from cookies
  if (!token && req.cookies && req.cookies['XSRF-TOKEN']) {
    token = req.cookies['XSRF-TOKEN'];
    // Add it to headers for future middleware
    req.headers['x-xsrf-token'] = token;
  }

  if (!token || typeof token !== 'string') {
    res.status(403).json({
      success: false,
      message: 'CSRF token is missing or invalid',
    });
    return;
  }

  // Verify the token
  if (!tokens.verify(secret, token)) {
    res.status(403).json({
      success: false,
      message: 'Invalid CSRF token',
    });
    return;
  }

  next();
};
