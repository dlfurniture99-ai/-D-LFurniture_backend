import jwt from 'jsonwebtoken';
import { JWT_EXPIRY } from './constants';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign(payload, secret, {
    expiresIn: JWT_EXPIRY.ACCESS_TOKEN,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    return jwt.verify(token, secret) as TokenPayload;
  } catch (error) {
    return null;
  }
};
