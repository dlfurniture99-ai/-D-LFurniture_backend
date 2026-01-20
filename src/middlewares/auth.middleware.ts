import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError } from './error.middleware';
import { HTTP_STATUS, ROLE } from '../utils/constants';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try { 
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new AppError('No token provided', HTTP_STATUS.UNAUTHORIZED);
    }

    const payload = verifyToken(token);

    if (!payload) {
      throw new AppError('Invalid or expired token', HTTP_STATUS.UNAUTHORIZED);
    }

    req.user = payload;
    next();
  } catch (error: any) {
    next(new AppError(error.message, HTTP_STATUS.UNAUTHORIZED));
  }
};

export const adminMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  next();
};
