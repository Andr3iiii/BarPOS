import { Request, Response } from 'express';
import { getClient, query } from '../database/db';
import { generateOrderReference } from '../utils/referenceGenerator';
import { CreateOrderInput } from '../types.js';
import { createOrderAccessToken, emitOrderCreated, emitOrderStatusChanged } from '../realtime';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  const client = await getClient();
  try {
    const { table_number, customer_notes, items, idempotency_key }: CreateOrderInput = req.body;
    const headerKey = req.headers['idempotency-key'];
    const rawIdempotencyKey = typeof headerKey === 'string' ? headerKey : idempotency_key;
    const idempotencyKey = rawIdempotencyKey ? String(rawIdempotencyKey).trim().slice(0, 100) : null;

    if (!table_number) {
      res.status(400).json({ success: false, message: 'Table number is required.' });
      return;
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'At least one item is required in the order.' });
      return;
    }

    // 1. Verify table exists and is active
    const tableRes = await client.query(
      'SELECT id, table_number, label, is_active FROM tables WHERE LOWER(table_number) = LOWER($1)',
      [table_number.trim()]
    );

    if (tableRes.rows.length === 0) {
      res.status(404).json({ success: false, message: `Table "${table_number}" does not exist.` });
      return;
    }

    const table = tableRes.rows[0];
    if (!table.is_active) {
      res.status(400).json({ success: false, message: `Table "${table.label}" is currently inactive.` });
      return;
    }

    // 2. Fetch and validate all products
    const productIds = items.map(i => i.product_id);
    const productsRes = await client.query(
      `SELECT id, name, price, is_available FROM products WHERE id = ANY($1::int[])`,
      [productIds]
    );

    const productMap = new Map<number, any>();
    productsRes.rows.forEach(p => productMap.set(p.id, p));

    // Calculate totals and prepare items
    let subtotal = 0;
    const validatedItems: Array<{
      product_id: number;
      product_name: string;
      unit_price: number;
      quantity: number;
      subtotal: number;
      item_notes?: string | null;
    }> = [];

    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (!product) {
        res.status(400).json({ success: false, message: `Product with ID ${item.product_id} not found.` });
        return;
      }
      if (!product.is_available) {
        res.status(400).json({ success: false, message: `Product "${product.name}" is currently unavailable.` });
        return;
      }
      const qty = parseInt(String(item.quantity), 10);
      if (isNaN(qty) || qty <= 0) {
        res.status(400).json({ success: false, message: `Invalid quantity for product "${product.name}".` });
        return;
      }

      const unitPrice = parseFloat(product.price);
      const itemSubtotal = unitPrice * qty;
      subtotal += itemSubtotal;

      validatedItems.push({
        product_id: product.id,
        product_name: product.name,
        unit_price: unitPrice,
        quantity: qty,
        subtotal: itemSubtotal,
        item_notes: item.item_notes ? String(item.item_notes).trim() : null
      });
    }

    const total = subtotal; // Tax can be 0 or inclusive

    await client.query('BEGIN');

    // 3. Atomically generate reference number (e.g. T1-1001)
    const referenceNo = await generateOrderReference(table.table_number, client);

    // 4. Insert order
    const orderRes = await client.query(
      `INSERT INTO orders (reference_no, table_id, status, payment_status, subtotal, tax, total, customer_notes, idempotency_key)
       VALUES ($1, $2, 'PENDING', 'UNPAID', $3, 0.00, $4, $5, $6)
       ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
       RETURNING *`,
      [referenceNo, table.id, subtotal, total, customer_notes ? customer_notes.trim() : null, idempotencyKey]
    );

    if (orderRes.rows.length === 0 && idempotencyKey) {
      const existingOrderRes = await client.query(
        `SELECT o.*, t.table_number, t.label AS table_label
         FROM orders o JOIN tables t ON t.id = o.table_id
         WHERE o.idempotency_key = $1`,
        [idempotencyKey]
      );
      const existingOrder = existingOrderRes.rows[0];
      if (!existingOrder) throw new Error('Unable to resolve the existing order request.');
      const existingItems = await client.query(
        `SELECT id, product_id, product_name, unit_price, quantity, subtotal, item_notes
         FROM order_items WHERE order_id = $1 ORDER BY id ASC`,
        [existingOrder.id]
      );
      await client.query('COMMIT');
      res.status(200).json({
        success: true,
        data: {
          id: existingOrder.id,
          reference_no: existingOrder.reference_no,
          table_number: existingOrder.table_number,
          table_label: existingOrder.table_label,
          status: existingOrder.status,
          payment_status: existingOrder.payment_status,
          subtotal: parseFloat(existingOrder.subtotal),
          total: parseFloat(existingOrder.total),
          customer_notes: existingOrder.customer_notes,
          created_at: existingOrder.created_at,
          items: existingItems.rows,
          realtime_token: createOrderAccessToken(existingOrder.reference_no)
        },
        message: 'Order already submitted.'
      });
      return;
    }

    const createdOrder = orderRes.rows[0];

    // 5. Insert order items
    for (const item of validatedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal, item_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          createdOrder.id,
          item.product_id,
          item.product_name,
          item.unit_price,
          item.quantity,
          item.subtotal,
          item.item_notes
        ]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: {
        id: createdOrder.id,
        reference_no: createdOrder.reference_no,
        table_number: table.table_number,
        table_label: table.label,
        status: createdOrder.status,
        payment_status: createdOrder.payment_status,
        subtotal: parseFloat(createdOrder.subtotal),
        total: parseFloat(createdOrder.total),
        customer_notes: createdOrder.customer_notes,
        created_at: createdOrder.created_at,
        items: validatedItems,
        realtime_token: createOrderAccessToken(referenceNo)
      },
      message: 'Order created successfully. Please proceed to the counter to pay.'
    });

    emitOrderCreated({
      orderId: createdOrder.id,
      referenceNo,
      tableNumber: table.table_number
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Order creation error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to create order.' });
  } finally {
    client.release();
  }
};

export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, limit = 100 } = req.query;

    let sql = `
      SELECT 
        o.id,
        o.reference_no,
        o.table_id,
        t.table_number,
        t.label AS table_label,
        o.status,
        o.payment_status,
        o.subtotal,
        o.tax,
        o.total,
        o.customer_notes,
        o.created_at,
        o.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name', oi.product_name,
              'unit_price', oi.unit_price,
              'quantity', oi.quantity,
              'subtotal', oi.subtotal,
              'item_notes', oi.item_notes
            ) ORDER BY oi.id ASC
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) AS items,
        (
          SELECT json_build_object(
            'id', p.id,
            'payment_method', p.payment_method,
            'amount_received', p.amount_received,
            'total_amount', p.total_amount,
            'change_amount', p.change_amount,
            'payment_reference', p.payment_reference,
            'cashier_name', u.full_name,
            'created_at', p.created_at
          )
          FROM payments p
          LEFT JOIN users u ON p.cashier_id = u.id
          WHERE p.order_id = o.id
          LIMIT 1
        ) AS payment
      FROM orders o
      JOIN tables t ON o.table_id = t.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'ALL') {
      params.push(status);
      sql += ` AND o.status = $${params.length}`;
    }

    if (search) {
      params.push(`%${String(search).trim()}%`);
      sql += ` AND (o.reference_no ILIKE $${params.length} OR t.table_number ILIKE $${params.length} OR t.label ILIKE $${params.length})`;
    }

    sql += ` GROUP BY o.id, t.id ORDER BY o.created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(String(limit), 10));

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch orders.' });
  }
};

export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT 
        o.id,
        o.reference_no,
        o.table_id,
        t.table_number,
        t.label AS table_label,
        o.status,
        o.payment_status,
        o.subtotal,
        o.tax,
        o.total,
        o.customer_notes,
        o.created_at,
        o.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name', oi.product_name,
              'unit_price', oi.unit_price,
              'quantity', oi.quantity,
              'subtotal', oi.subtotal,
              'item_notes', oi.item_notes
            ) ORDER BY oi.id ASC
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) AS items,
        (
          SELECT json_build_object(
            'id', p.id,
            'payment_method', p.payment_method,
            'amount_received', p.amount_received,
            'total_amount', p.total_amount,
            'change_amount', p.change_amount,
            'payment_reference', p.payment_reference,
            'cashier_name', u.full_name,
            'created_at', p.created_at
          )
          FROM payments p
          LEFT JOIN users u ON p.cashier_id = u.id
          WHERE p.order_id = o.id
          LIMIT 1
        ) AS payment
      FROM orders o
      JOIN tables t ON o.table_id = t.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1
      GROUP BY o.id, t.id
    `;

    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch order.' });
  }
};

export const getOrderByReference = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reference } = req.params;
    const cleanRef = reference.trim();

    const sql = `
      SELECT 
        o.id,
        o.reference_no,
        o.table_id,
        t.table_number,
        t.label AS table_label,
        o.status,
        o.payment_status,
        o.subtotal,
        o.tax,
        o.total,
        o.customer_notes,
        o.created_at,
        o.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name', oi.product_name,
              'unit_price', oi.unit_price,
              'quantity', oi.quantity,
              'subtotal', oi.subtotal,
              'item_notes', oi.item_notes
            ) ORDER BY oi.id ASC
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) AS items,
        (
          SELECT json_build_object(
            'id', p.id,
            'payment_method', p.payment_method,
            'amount_received', p.amount_received,
            'total_amount', p.total_amount,
            'change_amount', p.change_amount,
            'payment_reference', p.payment_reference,
            'cashier_name', u.full_name,
            'created_at', p.created_at
          )
          FROM payments p
          LEFT JOIN users u ON p.cashier_id = u.id
          WHERE p.order_id = o.id
          LIMIT 1
        ) AS payment
      FROM orders o
      JOIN tables t ON o.table_id = t.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE LOWER(o.reference_no) = LOWER($1) OR o.reference_no ILIKE $2
      GROUP BY o.id, t.id
      ORDER BY o.created_at DESC
      LIMIT 1
    `;

    const result = await query(sql, [cleanRef, `%${cleanRef}`]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: `No order found with reference "${reference}".` });
      return;
    }

    const orderData = result.rows[0];
    res.json({
      success: true,
      data: {
        ...orderData,
        realtime_token: createOrderAccessToken(orderData.reference_no)
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to search order.' });
  }
};

export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const check = await query(
      `SELECT o.status, o.payment_status, o.reference_no, t.table_number
       FROM orders o JOIN tables t ON t.id = o.table_id
       WHERE o.id = $1`,
      [id]
    );
    if (check.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    if (check.rows[0].status === 'PAID') {
      res.status(400).json({ success: false, message: 'Cannot cancel an order that has already been paid.' });
      return;
    }

    await query(
      "UPDATE orders SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [id]
    );

    res.json({
      success: true,
      message: 'Order cancelled successfully.'
    });
    emitOrderStatusChanged({
      orderId: Number(id),
      referenceNo: check.rows[0].reference_no || '',
      status: 'CANCELLED',
      paymentStatus: check.rows[0].payment_status,
      tableNumber: check.rows[0].table_number
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to cancel order.' });
  }
};
