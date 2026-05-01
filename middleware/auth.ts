import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  user?: any;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
     // Prefer token from cookies (more reliable), fallback to Authorization header
     let token = req.cookies?.authToken;
     
     // If no cookie, try to get from Authorization header (for API calls)
     if (!token) {
       token = req.headers.authorization?.split(' ')[1];
     }

     if (!token) {
       return res.status(401).json({ success: false, message: 'No token provided' });
     }

     const jwtSecret = process.env.JWT_SECRET;
     if (!jwtSecret) {
       console.error('JWT_SECRET is not defined');
       return res.status(500).json({ success: false, message: 'Authentication configuration error' });
     }

     const decoded = jwt.verify(token, jwtSecret);
     req.userId = (decoded as any).id || (decoded as any).userId;
     req.userRole = (decoded as any).role;
     req.user = decoded;
     return next();
   } catch (error) {
     if (error instanceof jwt.TokenExpiredError) {
       return res.status(401).json({ success: false, message: 'Token expired' });
     }
     console.error('[AUTH ERROR]', error instanceof Error ? error.message : error);
     return res.status(401).json({ success: false, message: 'Invalid token' });
   }
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  return next();
};

export const superAdminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.userRole !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Super Admin access required' });
  }
  return next();
};

export const deliveryBoyMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.userRole !== 'deliveryBoy' && req.userRole !== 'admin' && req.userRole !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Delivery Boy access required' });
  }
  return next();
};
