import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../database/db';
import { config } from '../config/env';
import { AuthenticatedRequest } from '../middleware/auth';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ success: false, message: 'Username and password are required.' });
      return;
    }

    const result = await query(
      'SELECT id, username, password_hash, full_name, role, is_active FROM users WHERE LOWER(username) = LOWER($1)',
      [username.trim()]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ success: false, message: 'Invalid username or password.' });
      return;
    }

    const user = result.rows[0];
    if (!user.is_active) {
      res.status(403).json({ success: false, message: 'This account has been deactivated.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid username or password.' });
      return;
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '12h' });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          role: user.role
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Login failed.' });
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }
  res.json({
    success: true,
    data: req.user
  });
};
