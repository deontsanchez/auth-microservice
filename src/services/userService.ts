import { Types } from 'mongoose';
import User from '../models/User';
import { UserResponse } from '../types';
import { publishMessage } from '../config/rabbitmq';

// Get a user by ID
const getUserById = async (
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
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

// Update a user's profile
const updateUserProfile = async (
  userId: Types.ObjectId | string,
  userData: Partial<{ name: string; email: string }>
): Promise<UserResponse> => {
  // Find user first
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Update fields if provided
  if (userData.name) {
    user.name = userData.name;
  }

  if (userData.email) {
    // Check if email is already in use
    const emailExists = await User.findOne({
      email: userData.email,
      _id: { $ne: userId },
    });

    if (emailExists) {
      throw new Error('Email is already in use');
    }

    user.email = userData.email;
  }

  // Save the updated user
  await user.save();

  // Publish user updated event
  publishMessage('auth', 'user.updated', {
    userId: user._id.toString(),
    updatedAt: new Date().toISOString(),
  });

  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

// Change user password
const changePassword = async (
  userId: Types.ObjectId | string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  // Find user
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Verify current password
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    throw new Error('Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Publish password changed event
  publishMessage('auth', 'user.password_changed', {
    userId: user._id.toString(),
    updatedAt: new Date().toISOString(),
  });
};

// Admin: Update user status (active/inactive)
const updateUserStatus = async (
  userId: Types.ObjectId | string,
  isActive: boolean
): Promise<UserResponse> => {
  // Find user
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Update status
  user.isActive = isActive;
  await user.save();

  // Publish user status updated event
  publishMessage('auth', 'user.status_updated', {
    userId: user._id.toString(),
    isActive,
    updatedAt: new Date().toISOString(),
  });

  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

// Admin: List all users with pagination
const listUsers = async (
  page: number = 1,
  limit: number = 10
): Promise<{
  users: UserResponse[];
  total: number;
  pages: number;
  currentPage: number;
}> => {
  // Calculate pagination
  const skip = (page - 1) * limit;

  // Get total count for pagination
  const total = await User.countDocuments();

  // Get users
  const users = await User.find()
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Format response
  const formattedUsers = users.map(user => ({
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));

  return {
    users: formattedUsers,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  };
};

export {
  getUserById,
  updateUserProfile,
  changePassword,
  updateUserStatus,
  listUsers,
};
