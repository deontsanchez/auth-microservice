import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Types } from 'mongoose';
import Token from '../models/Token';
import { TokenPayload } from '../types';

const generateAccessToken = (userId: Types.ObjectId | string): string => {
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

  return jwt.sign({ id: userId }, secret, { expiresIn } as jwt.SignOptions);
};

const generateRefreshToken = async (
  userId: Types.ObjectId | string
): Promise<string> => {
  // Create a random token
  const refreshToken = crypto.randomBytes(40).toString('hex');

  // Calculate expiry date - 7 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Save to database
  await Token.create({
    userId,
    token: refreshToken,
    expiresAt,
  });

  return refreshToken;
};

const verifyToken = (token: string): TokenPayload => {
  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    return jwt.verify(token, secret) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

const verifyRefreshToken = async (
  refreshToken: string
): Promise<Types.ObjectId> => {
  try {
    const tokenDoc = await Token.findOne({
      token: refreshToken,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });

    if (!tokenDoc) {
      throw new Error('Invalid or expired refresh token');
    }

    return tokenDoc.userId;
  } catch (error) {
    throw error;
  }
};

const revokeRefreshToken = async (refreshToken: string): Promise<void> => {
  try {
    await Token.findOneAndUpdate({ token: refreshToken }, { isRevoked: true });
  } catch (error) {
    throw error;
  }
};

export {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  revokeRefreshToken,
};
