import { Request, Response } from 'express';
import { query } from '../database/db';

export const getDashboardMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    // Current date sales and order metrics
    const metricsSql = `
      SELECT
        COALESCE(SUM(CASE WHEN p.id IS NOT NULL AND DATE(p.created_at) = CURRENT_DATE THEN p.total_amount ELSE 0 END), 0) AS today_sales,
        COALESCE(COUNT(CASE WHEN o.status = 'PENDING' AND DATE(o.created_at) = CURRENT_DATE THEN 1 END), 0) AS pending_orders,
        COALESCE(COUNT(CASE WHEN o.status = 'PAID' AND DATE(o.created_at) = CURRENT_DATE THEN 1 END), 0) AS paid_orders,
        COALESCE(COUNT(CASE WHEN DATE(o.created_at) = CURRENT_DATE THEN 1 END), 0) AS total_orders
      FROM orders o
      LEFT JOIN payments p ON o.id = p.order_id
    `;

    const result = await query(metricsSql);
    const row = result.rows[0];

    res.json({
      success: true,
      data: {
        today_sales: parseFloat(row.today_sales || '0'),
        pending_orders: parseInt(row.pending_orders || '0', 10),
        paid_orders: parseInt(row.paid_orders || '0', 10),
        total_orders: parseInt(row.total_orders || '0', 10)
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch dashboard metrics.' });
  }
};

export const getSalesReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period = 'today', start_date, end_date, payment_method } = req.query;

    let dateCondition = "DATE(p.created_at) = CURRENT_DATE";
    const params: any[] = [];

    if (period === 'yesterday') {
      dateCondition = "DATE(p.created_at) = CURRENT_DATE - INTERVAL '1 day'";
    } else if (period === 'week') {
      dateCondition = "p.created_at >= CURRENT_DATE - INTERVAL '7 days'";
    } else if (period === 'month') {
      dateCondition = "p.created_at >= CURRENT_DATE - INTERVAL '30 days'";
    } else if (period === 'custom' && start_date && end_date) {
      params.push(start_date);
      params.push(end_date);
      dateCondition = `DATE(p.created_at) BETWEEN $1 AND $2`;
    }

    let filterSql = `WHERE ${dateCondition}`;
    if (payment_method && payment_method !== 'ALL') {
      params.push(payment_method);
      filterSql += ` AND p.payment_method = $${params.length}`;
    }

    const recordsSql = `
      SELECT 
        o.id AS order_id,
        o.reference_no,
        t.table_number,
        t.label AS table_label,
        TO_CHAR(p.created_at, 'YYYY-MM-DD') AS date,
        TO_CHAR(p.created_at, 'HH24:MI:SS') AS time,
        p.total_amount AS total,
        p.payment_method,
        p.amount_received,
        p.change_amount,
        COALESCE(u.full_name, 'Cashier') AS cashier_name,
        o.status,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS items_count
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      JOIN tables t ON o.table_id = t.id
      LEFT JOIN users u ON p.cashier_id = u.id
      ${filterSql}
      ORDER BY p.created_at DESC
    `;

    const recordsRes = await query(recordsSql, params);
    const records = recordsRes.rows.map(r => ({
      ...r,
      total: parseFloat(r.total),
      amount_received: parseFloat(r.amount_received),
      change_amount: parseFloat(r.change_amount),
      items_count: parseInt(r.items_count, 10)
    }));

    // Calculate aggregations
    let totalRevenue = 0;
    const byMethod = {
      CASH: 0,
      GCASH: 0,
      CARD: 0
    };

    records.forEach(r => {
      totalRevenue += r.total;
      if (r.payment_method === 'CASH') byMethod.CASH += r.total;
      if (r.payment_method === 'GCASH') byMethod.GCASH += r.total;
      if (r.payment_method === 'CARD') byMethod.CARD += r.total;
    });

    const averageTicket = records.length > 0 ? totalRevenue / records.length : 0;

    res.json({
      success: true,
      data: {
        total_revenue: totalRevenue,
        total_orders: records.length,
        average_ticket: averageTicket,
        by_payment_method: byMethod,
        records
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch sales reports.' });
  }
};
