import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../controllers/userController';
import { protect, admin } from '../middlewares/auth';
import { body } from 'express-validator';
import { asyncHandler } from '../utils/routeHandler';

const router = express.Router();

// All routes are protected and require admin role
router.use(protect, admin);

// Get all users
router.get('/', asyncHandler(getAllUsers));

// Get single user
router.get('/:id', asyncHandler(getUserById));

// Update user
router.put(
  '/:id',
  [
    body('name').optional(),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please include a valid email'),
    body('role')
      .optional()
      .isIn(['user', 'admin'])
      .withMessage('Role must be either user or admin'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
  ],
  asyncHandler(updateUser)
);

// Delete user
router.delete('/:id', asyncHandler(deleteUser));

export default router;
