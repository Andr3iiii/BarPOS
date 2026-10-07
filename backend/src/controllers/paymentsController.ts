import { Response } from 'express';
import { getClient, query } from '../database/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { ProcessPaymentInput, BAR_SETTINGS } from '../types.js';

export const processPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const client = await getClient();
  try {
    const { order_id, payment_method, amount_received, payment_reference }: ProcessPaymentInput = req.body;
    const cashierId = req.user ? req.user.id : null;
    const cashierName = req.user ? req.user.full_name : 'Cashier';

    if (!order_id || !payment_method) {
      res.status(400).json({ success: false, message: 'Order ID and payment method are required.' });
      return;
    }

    if (!['CASH', 'GCASH', 'CARD'].includes(payment_method)) {
      res.status(400).json({ success: false, message: 'Invalid payment method. Supported: CASH, GCASH, CARD.' });
      return;
    }

    // Check order
    const orderRes = await client.query(
      `SELECT o.*, t.table_number, t.label AS table_label 
       FROM orders o 
       JOIN tables t ON o.table_id = t.id 
       WHERE o.id = $1`,
      [order_id]
    );

    if (orderRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    const order = orderRes.rows[0];

    if (order.status === 'PAID' || order.payment_status === 'PAID') {
      res.status(400).json({ success: false, message: 'This order has already been paid.' });
      return;
    }

    if (order.status === 'CANCELLED') {
      res.status(400).json({ success: false, message: 'Cannot process payment for a cancelled order.' });
      return;
    }

    const totalAmount = parseFloat(order.total);
    const received = parseFloat(String(amount_received));

    if (isNaN(received) || received <= 0) {
      res.status(400).json({ success: false, message: 'Please enter a valid amount received.' });
      return;
    }

    // Critical validation: For cash, prevent confirmation if insufficient
    if (payment_method === 'CASH' && received < totalAmount) {
      res.status(400).json({
        success: false,
        message: `Insufficient cash received. Order total is ₱${totalAmount.toFixed(2)}, but received ₱${received.toFixed(2)}.`
      });
      return;
    }

    const changeAmount = payment_method === 'CASH' ? Math.max(0, received - totalAmount) : 0;
    const effectiveReceived = payment_method === 'CASH' ? received : totalAmount;

    await client.query('BEGIN');

    // 1. Insert into payments table
    const paymentRes = await client.query(
      `INSERT INTO payments (order_id, payment_method, total_amount, amount_received, change_amount, payment_reference, cashier_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        order.id,
        payment_method,
        totalAmount,
        effectiveReceived,
        changeAmount,
        payment_reference ? String(payment_reference).trim() : null,
        cashierId
      ]
    );

    const payment = paymentRes.rows[0];

    // 2. Update order status and payment status
    await client.query(
      `UPDATE orders 
       SET status = 'PAID', payment_status = 'PAID', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [order.id]
    );

    // 3. Fetch order items for the receipt
    const itemsRes = await client.query(
      `SELECT product_name, unit_price, quantity, subtotal, item_notes 
       FROM order_items 
       WHERE order_id = $1 
       ORDER BY id ASC`,
      [order.id]
    );

    await client.query('COMMIT');

    // Formatted Receipt payload ready for instant printing
    const receiptData = {
      bar_name: BAR_SETTINGS.NAME,
      tagline: BAR_SETTINGS.TAGLINE,
      order_id: order.id,
      reference_no: order.reference_no,
      table_number: order.table_number,
      table_label: order.table_label,
      date: new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }),
      time: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      items: itemsRes.rows.map(item => ({
        name: item.product_name,
        unit_price: parseFloat(item.unit_price),
        quantity: item.quantity,
        subtotal: parseFloat(item.subtotal),
        notes: item.item_notes
      })),
      subtotal: parseFloat(order.subtotal),
      tax: parseFloat(order.tax),
      total: totalAmount,
      payment_method,
      amount_received: effectiveReceived,
      change_amount: changeAmount,
      payment_reference: payment.payment_reference,
      cashier_name: cashierName,
      footer_message: 'Thank you for visiting! Please come again.'
    };

    res.json({
      success: true,
      message: 'Payment recorded successfully. Order is now PAID.',
      data: {
        payment,
        receipt: receiptData
      }
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Payment processing error:', err);
    res.status(500).json({ success: false, message: err.message || 'Payment processing failed.' });
  } finally {
    client.release();
  }
};

export const getReceipt = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;

    const orderRes = await query(
      `SELECT o.*, t.table_number, t.label AS table_label,
              p.payment_method, p.amount_received, p.change_amount, p.payment_reference, p.created_at AS payment_time,
              u.full_name AS cashier_name
       FROM orders o
       JOIN tables t ON o.table_id = t.id
       LEFT JOIN payments p ON o.id = p.order_id
       LEFT JOIN users u ON p.cashier_id = u.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    const order = orderRes.rows[0];
    const itemsRes = await query(
      `SELECT product_name, unit_price, quantity, subtotal, item_notes 
       FROM order_items 
       WHERE order_id = $1 
       ORDER BY id ASC`,
      [orderId]
    );

    const payDate = order.payment_time ? new Date(order.payment_time) : new Date(order.created_at);

    const receiptData = {
      bar_name: BAR_SETTINGS.NAME,
      tagline: BAR_SETTINGS.TAGLINE,
      order_id: order.id,
      reference_no: order.reference_no,
      table_number: order.table_number,
      table_label: order.table_label,
      date: payDate.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }),
      time: payDate.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      items: itemsRes.rows.map(item => ({
        name: item.product_name,
        unit_price: parseFloat(item.unit_price),
        quantity: item.quantity,
        subtotal: parseFloat(item.subtotal),
        notes: item.item_notes
      })),
      subtotal: parseFloat(order.subtotal),
      tax: parseFloat(order.tax),
      total: parseFloat(order.total),
      payment_method: order.payment_method || 'PENDING',
      amount_received: order.amount_received ? parseFloat(order.amount_received) : parseFloat(order.total),
      change_amount: order.change_amount ? parseFloat(order.change_amount) : 0,
      payment_reference: order.payment_reference,
      cashier_name: order.cashier_name || 'Counter',
      footer_message: 'Thank you for visiting! Please come again.'
    };

    res.json({
      success: true,
      data: receiptData
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to generate receipt.' });
  }
};
