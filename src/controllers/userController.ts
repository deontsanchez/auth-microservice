import { Request, Response } from 'express';
import { Types } from 'mongoose';
import User from '../models/User';
import { publishMessage } from '../config/rabbitmq';
import { UserResponse, IUser } from '../types';

// Convert any ID to a valid MongoDB ObjectId or string
const toValidId = (id: any): string | Types.ObjectId => {
  if (id instanceof Types.ObjectId) {
    return id;
  }
  return typeof id === 'string' ? id : String(id);
};

// Get all users (admin only)
const getAllUsers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const users = await User.find({}).select('-password');

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Server Error',
    });
  }
};

// Get user by ID (admin only)
const getUserById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Server Error',
    });
  }
};

// Update user (admin only)
const updateUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, email, role, isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (role !== undefined) user.role = role as 'user' | 'admin';
    if (isActive !== undefined) user.isActive = isActive;

    const updatedUser = await user.save();

    // Prepare a safely typed response object
    const userToPublish = {
      userId: updatedUser._id.toString(),
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      updatedAt: new Date().toISOString(),
    };

    // Publish user updated event
    publishMessage('auth', 'user.updated', userToPublish);

    const userResponse: UserResponse = {
      _id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    return res.status(200).json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Server Error',
    });
  }
};

// Delete user (admin only)
const deleteUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Don't allow deleting self
    if (req.user._id && user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    const userId = user._id.toString();
    const userEmail = user.email;

    await user.deleteOne();

    // Publish user deleted event
    publishMessage('auth', 'user.deleted', {
      userId,
      email: userEmail,
      deletedAt: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Server Error',
    });
  }
};

export { getAllUsers, getUserById, updateUser, deleteUser };
