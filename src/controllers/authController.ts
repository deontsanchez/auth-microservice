import { Request, Response } from 'express';
import {
  registerUser,
  loginUser,
  refreshUserToken,
  logoutUser,
  getCurrentUserProfile,
  isValidUser,
} from '../services/authService';

// Register a new user
const register = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, email, password } = req.body;

    const result = await registerUser(name, email, password);

    return res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Server Error',
    });
  }
};

// Login user
const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;

    const result = await loginUser(email, password);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : 'Server Error',
    });
  }
};

// Refresh access token
const refreshToken = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { refreshToken } = req.body;

    const result = await refreshUserToken(refreshToken);

    return res.status(200).json({
      success: true,
      ...result,
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

    let userId: string | undefined;
    if (req.user && isValidUser(req.user)) {
      userId = req.user._id.toString();
    }

    await logoutUser(refreshToken, userId);

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

    const user = await getCurrentUserProfile(req.user._id);

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'User not found',
    });
  }
};

export { register, login, refreshToken, logout, getCurrentUser };
