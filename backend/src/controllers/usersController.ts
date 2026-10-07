import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../database/db';

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      'SELECT id, username, full_name, role, is_active, created_at FROM users ORDER BY id ASC'
    );
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch users.' });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, full_name, role } = req.body;

    if (!username || !password || !full_name || !role) {
      res.status(400).json({ success: false, message: 'Username, password, full name, and role are required.' });
      return;
    }

    if (!['admin', 'cashier'].includes(role)) {
      res.status(400).json({ success: false, message: 'Invalid role. Must be admin or cashier.' });
      return;
    }

    const existing = await query('SELECT id FROM users WHERE LOWER(username) = LOWER($1)', [username.trim()]);
    if (existing.rows.length > 0) {
      res.status(409).json({ success: false, message: 'Username already taken.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (username, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, username, full_name, role, is_active, created_at`,
      [username.trim(), passwordHash, full_name.trim(), role]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'User created successfully.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to create user.' });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { full_name, role, is_active, password } = req.body;

    const existing = await query('SELECT id FROM users WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (full_name !== undefined) {
      values.push(full_name.trim());
      updates.push(`full_name = $${values.length}`);
    }
    if (role !== undefined) {
      if (!['admin', 'cashier'].includes(role)) {
        res.status(400).json({ success: false, message: 'Invalid role.' });
        return;
      }
      values.push(role);
      updates.push(`role = $${values.length}`);
    }
    if (is_active !== undefined) {
      values.push(Boolean(is_active));
      updates.push(`is_active = $${values.length}`);
    }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      values.push(hash);
      updates.push(`password_hash = $${values.length}`);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const sql = `
      UPDATE users SET ${updates.join(', ')} 
      WHERE id = $${values.length} 
      RETURNING id, username, full_name, role, is_active, created_at
    `;
    const result = await query(sql, values);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'User updated successfully.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update user.' });
  }
};
