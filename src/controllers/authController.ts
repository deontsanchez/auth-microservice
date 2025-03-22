import { Request, Response } from 'express';
import { Types } from 'mongoose';
import User from '../models/User';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
} from '../utils/jwt';
import { publishMessage } from '../config/rabbitmq';
import { UserResponse, IUser } from '../types';

// Type guard to check if user is valid
const isValidUser = (user: any): user is IUser => {
  return user && user._id && typeof user.name === 'string';
};

// Register a new user
const register = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    });

    if (isValidUser(user)) {
      // Publish user created event
      publishMessage('auth', 'user.created', {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      });

      // Generate tokens
      const accessToken = generateAccessToken(user._id);
      const refreshToken = await generateRefreshToken(user._id);

      const userResponse: UserResponse = {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      };

      return res.status(201).json({
        success: true,
        accessToken,
        refreshToken,
        user: userResponse,
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid user data',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Server Error',
    });
  }
};

// Login user
const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is disabled',
      });
    }

    // Match password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    // Publish login event
    publishMessage('auth', 'user.login', {
      userId: user._id.toString(),
      timestamp: new Date().toISOString(),
    });

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);

    const userResponse: UserResponse = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: userResponse,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Server Error',
    });
  }
};

// Refresh access token
const refreshToken = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Verify refresh token
    const userId = await verifyRefreshToken(refreshToken);

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is disabled',
      });
    }

    // Generate new access token
    const accessToken = generateAccessToken(user._id);

    return res.status(200).json({
      success: true,
      accessToken,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Invalid or expired refresh token',
    });
  }
};

// Logout user
const logout = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Revoke refresh token
    await revokeRefreshToken(refreshToken);

    // Publish logout event
    if (req.user && isValidUser(req.user)) {
      publishMessage('auth', 'user.logout', {
        userId: req.user._id.toString(),
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully logged out',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Server Error',
    });
  }
};

// Get current user profile
const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const user = await User.findById(req.user._id).select('-password');

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

export { register, login, refreshToken, logout, getCurrentUser };
