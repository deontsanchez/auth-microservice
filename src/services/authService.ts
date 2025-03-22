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

// Service for user registration
const registerUser = async (
  name: string,
  email: string,
  password: string
): Promise<{
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}> => {
  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new Error('User already exists');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
  });

  if (!isValidUser(user)) {
    throw new Error('Invalid user data');
  }

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

  return {
    user: userResponse,
    accessToken,
    refreshToken,
  };
};

// Service for user login
const loginUser = async (
  email: string,
  password: string
): Promise<{
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}> => {
  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new Error('User account is disabled');
  }

  // Check if account is locked
  if (user.lockUntil && user.lockUntil > new Date()) {
    throw new Error('Account is temporarily locked. Please try again later');
  }

  // Match password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    // Increment failed login attempts and save
    await user.incrementLoginAttempts();
    throw new Error('Invalid email or password');
  }

  // Reset failed login attempts on successful login
  if (user.failedLoginAttempts > 0) {
    await user.resetLoginAttempts();
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

  return {
    user: userResponse,
    accessToken,
    refreshToken,
  };
};

// Service for refreshing access token
const refreshUserToken = async (
  refreshToken: string
): Promise<{
  accessToken: string;
}> => {
  if (!refreshToken) {
    throw new Error('Refresh token is required');
  }

  // Verify refresh token
  const userId = await verifyRefreshToken(refreshToken);

  // Get user
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new Error('User account is disabled');
  }

  // Generate new access token
  const accessToken = generateAccessToken(user._id);

  return {
    accessToken,
  };
};

// Service for user logout
const logoutUser = async (
  refreshToken: string,
  userId?: string
): Promise<void> => {
  if (!refreshToken) {
    throw new Error('Refresh token is required');
  }

  // Revoke refresh token
  await revokeRefreshToken(refreshToken);

  // Publish logout event if userId provided
  if (userId) {
    publishMessage('auth', 'user.logout', {
      userId,
      timestamp: new Date().toISOString(),
    });
  }
};

// Service to get current user profile
const getCurrentUserProfile = async (
  userId: Types.ObjectId | string
): Promise<UserResponse> => {
  const user = await User.findById(userId).select('-password');

  if (!user) {
    throw new Error('User not found');
  }

  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
};

export {
  registerUser,
  loginUser,
  refreshUserToken,
  logoutUser,
  getCurrentUserProfile,
  isValidUser,
};
