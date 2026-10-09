import { Request, Response } from 'express';
import { query } from '../database/db';
import { createCustomerAccessToken } from '../realtime';

export const getAllTables = async (req: Request, res: Response): Promise<void> => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    let sql = 'SELECT * FROM tables';
    if (!includeInactive) {
      sql += ' WHERE is_active = true';
    }
    sql += ' ORDER BY id ASC';

    const result = await query(sql);
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch tables.' });
  }
};

export const getTableByNumber = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tableNumber } = req.params;
    const result = await query(
      'SELECT * FROM tables WHERE LOWER(table_number) = LOWER($1) AND is_active = true',
      [tableNumber.trim()]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: `Table "${tableNumber}" was not found or is inactive.` });
      return;
    }

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        realtime_token: createCustomerAccessToken(result.rows[0].table_number)
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to find table.' });
  }
};

export const createTable = async (req: Request, res: Response): Promise<void> => {
  try {
    const { table_number, label } = req.body;
    if (!table_number) {
      res.status(400).json({ success: false, message: 'Table number/identifier is required.' });
      return;
    }

    const cleanNumber = String(table_number).trim();
    const cleanLabel = label ? String(label).trim() : `Table ${cleanNumber}`;

    const existing = await query('SELECT id FROM tables WHERE LOWER(table_number) = LOWER($1)', [cleanNumber]);
    if (existing.rows.length > 0) {
      res.status(409).json({ success: false, message: `Table number "${cleanNumber}" already exists.` });
      return;
    }

    const result = await query(
      `INSERT INTO tables (table_number, label, is_active)
       VALUES ($1, $2, true)
       RETURNING *`,
      [cleanNumber, cleanLabel]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Table created successfully.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to create table.' });
  }
};

export const updateTable = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { label, is_active } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (label !== undefined) {
      values.push(label.trim());
      updates.push(`label = $${values.length}`);
    }
    if (is_active !== undefined) {
      values.push(Boolean(is_active));
      updates.push(`is_active = $${values.length}`);
    }

    if (updates.length === 0) {
      res.status(400).json({ success: false, message: 'No updates provided.' });
      return;
    }

    values.push(id);
    const sql = `UPDATE tables SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`;
    const result = await query(sql, values);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Table not found.' });
      return;
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Table updated successfully.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update table.' });
  }
};
