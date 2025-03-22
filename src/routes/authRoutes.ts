import express from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
} from '../controllers/authController';
import { protect } from '../middlewares/auth';
import { body } from 'express-validator';
import { asyncHandler } from '../utils/routeHandler';
import { authLimiter, registrationLimiter } from '../middlewares/rateLimiter';

const router = express.Router();

// Register user
router.post(
  '/register',
  registrationLimiter,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      )
      .withMessage(
        'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
      ),
  ],
  asyncHandler(register)
);

// Login user
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required'),
  ],
  asyncHandler(login)
);

// Refresh token
router.post(
  '/refresh-token',
  [body('refreshToken').notEmpty().withMessage('Refresh token is required')],
  asyncHandler(refreshToken)
);

// Logout user
router.post(
  '/logout',
  [body('refreshToken').notEmpty().withMessage('Refresh token is required')],
  protect,
  asyncHandler(logout)
);

// Get current user profile
router.get('/me', protect, asyncHandler(getCurrentUser));

export default router;
