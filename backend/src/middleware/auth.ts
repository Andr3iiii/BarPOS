import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { UserRole } from '../types.js';

export interface AuthenticatedUser {
  id: number;
  username: string;
  role: UserRole;
  full_name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const [scheme, token] = authHeader?.split(' ') ?? [];

  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    return;
  }

  jwt.verify(token, config.jwtSecret, (err, decoded) => {
    if (err || !decoded || typeof decoded === 'string') {
      res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
      return;
    }

    const user = decoded as Partial<AuthenticatedUser>;
    if (
      typeof user.id !== 'number' ||
      typeof user.username !== 'string' ||
      typeof user.full_name !== 'string' ||
      (user.role !== 'admin' && user.role !== 'cashier')
    ) {
      res.status(401).json({ success: false, message: 'Invalid session token.' });
      return;
    }

    req.user = user as AuthenticatedUser;
    next();
  });
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Forbidden. Insufficient permissions for this action.' });
      return;
    }
    next();
  };
};

export const requireAdmin = requireRole('admin');
export const requireCashierOrAdmin = requireRole('admin', 'cashier');
