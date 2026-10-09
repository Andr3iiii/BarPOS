import { Request, Response } from 'express';
import { query } from '../database/db';
import { emitInventoryUpdated } from '../realtime';

export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.headers.authorization && req.query.includeInactive !== 'true') {
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    }
    const includeInactive = req.query.includeInactive === 'true';
    let sql = 'SELECT * FROM categories';
    if (!includeInactive) {
      sql += ' WHERE is_active = true';
    }
    sql += ' ORDER BY display_order ASC, name ASC';

    const result = await query(sql);
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch categories.' });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, icon, display_order, is_active } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'Category name is required.' });
      return;
    }

    const result = await query(
      `INSERT INTO categories (name, icon, display_order, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        name.trim(),
        icon || 'wine',
        display_order !== undefined ? parseInt(display_order, 10) : 0,
        is_active !== undefined ? Boolean(is_active) : true
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Category created successfully.'
    });
    emitInventoryUpdated({ entity: 'category', entityId: result.rows[0].id, action: 'created' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to create category.' });
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, icon, display_order, is_active } = req.body;

    const existing = await query('SELECT id FROM categories WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Category not found.' });
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      values.push(name.trim());
      updates.push(`name = $${values.length}`);
    }
    if (icon !== undefined) {
      values.push(icon);
      updates.push(`icon = $${values.length}`);
    }
    if (display_order !== undefined) {
      values.push(parseInt(display_order, 10));
      updates.push(`display_order = $${values.length}`);
    }
    if (is_active !== undefined) {
      values.push(Boolean(is_active));
      updates.push(`is_active = $${values.length}`);
    }

    values.push(id);
    const sql = `UPDATE categories SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`;
    const result = await query(sql, values);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Category updated successfully.'
    });
    emitInventoryUpdated({ entity: 'category', entityId: result.rows[0].id, action: 'updated' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update category.' });
  }
};

export const deactivateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await query('UPDATE categories SET is_active = false WHERE id = $1', [id]);
    res.json({
      success: true,
      message: 'Category deactivated successfully.'
    });
    emitInventoryUpdated({ entity: 'category', entityId: Number(id), action: 'deactivated' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to deactivate category.' });
  }
};
