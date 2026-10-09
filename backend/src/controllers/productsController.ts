import { Request, Response } from 'express';
import { query } from '../database/db';
import { emitInventoryUpdated } from '../realtime';

export const getPublicMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    res.setHeader('Cache-Control', 'no-store');
    const result = await query(`
      SELECT 
        p.id, 
        p.category_id, 
        c.name AS category_name,
        p.name, 
        p.description, 
        p.price, 
        p.image_url, 
        p.is_available,
        p.created_at,
        p.updated_at
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.is_available = true AND c.is_active = true
      ORDER BY c.display_order ASC, p.name ASC
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch menu.' });
  }
};

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const categoryId = req.query.categoryId;

    let sql = `
      SELECT 
        p.id, 
        p.category_id, 
        c.name AS category_name,
        p.name, 
        p.description, 
        p.price, 
        p.image_url, 
        p.is_available,
        p.created_at,
        p.updated_at
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (!includeInactive) {
      sql += ' AND p.is_available = true';
    }

    if (categoryId) {
      params.push(categoryId);
      sql += ` AND p.category_id = $${params.length}`;
    }

    sql += ' ORDER BY c.display_order ASC, p.name ASC';

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch products.' });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT 
        p.id, 
        p.category_id, 
        c.name AS category_name,
        p.name, 
        p.description, 
        p.price, 
        p.image_url, 
        p.is_available,
        p.created_at,
        p.updated_at
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch product.' });
  }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category_id, name, description, price, image_url, is_available } = req.body;

    if (!category_id || !name || price === undefined) {
      res.status(400).json({ success: false, message: 'Category, name, and price are required.' });
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      res.status(400).json({ success: false, message: 'Price must be a valid positive number.' });
      return;
    }

    const result = await query(
      `INSERT INTO products (category_id, name, description, price, image_url, is_available)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        category_id,
        name.trim(),
        description ? description.trim() : null,
        numPrice,
        image_url || null,
        is_available !== undefined ? Boolean(is_available) : true
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Product created successfully.'
    });
    emitInventoryUpdated({ entity: 'product', entityId: result.rows[0].id, action: 'created' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to create product.' });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { category_id, name, description, price, image_url, is_available } = req.body;

    const existing = await query('SELECT id FROM products WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (category_id !== undefined) {
      values.push(category_id);
      updates.push(`category_id = $${values.length}`);
    }
    if (name !== undefined) {
      values.push(name.trim());
      updates.push(`name = $${values.length}`);
    }
    if (description !== undefined) {
      values.push(description ? description.trim() : null);
      updates.push(`description = $${values.length}`);
    }
    if (price !== undefined) {
      const numPrice = parseFloat(price);
      if (isNaN(numPrice) || numPrice < 0) {
        res.status(400).json({ success: false, message: 'Price must be a valid positive number.' });
        return;
      }
      values.push(numPrice);
      updates.push(`price = $${values.length}`);
    }
    if (image_url !== undefined) {
      values.push(image_url);
      updates.push(`image_url = $${values.length}`);
    }
    if (is_available !== undefined) {
      values.push(Boolean(is_available));
      updates.push(`is_available = $${values.length}`);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(id);
    const sql = `UPDATE products SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`;
    const result = await query(sql, values);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Product updated successfully.'
    });
    emitInventoryUpdated({ entity: 'product', entityId: result.rows[0].id, action: 'updated' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update product.' });
  }
};

export const deleteOrDeactivateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if product was used in any order items
    const orderCheck = await query('SELECT id FROM order_items WHERE product_id = $1 LIMIT 1', [id]);
    
    if (orderCheck.rows.length > 0) {
      // Deactivate rather than delete to protect historical sales data as requested in Section 17
      await query('UPDATE products SET is_available = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
      res.json({
        success: true,
        message: 'Product is associated with existing orders. It has been deactivated to preserve transaction records.'
      });
      emitInventoryUpdated({ entity: 'product', entityId: Number(id), action: 'deactivated' });
      return;
    }

    // If completely unused, safe to delete
    await query('DELETE FROM products WHERE id = $1', [id]);
    res.json({
      success: true,
      message: 'Product deleted successfully.'
    });
    emitInventoryUpdated({ entity: 'product', entityId: Number(id), action: 'deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to delete product.' });
  }
};
