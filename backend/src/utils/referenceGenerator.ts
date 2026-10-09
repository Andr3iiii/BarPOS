import { PoolClient } from 'pg';
import { query } from '../database/db';

/**
 * Atomically generates a unique, human-friendly order reference number.
 * Format: T{tableNumber}-{sequence}
 * Example: T1-1001, T2-1002, T1-1003
 */
export async function generateOrderReference(tableNumber: string, client?: PoolClient): Promise<string> {
  // Format table prefix: clean spaces or symbols
  const cleanTable = tableNumber.trim().toUpperCase();
  const tablePrefix = cleanTable.startsWith('T') ? cleanTable : `T${cleanTable}`;

  // Ensure current_seq continues monotonically from global maximum across all dates
  const sql = `
    WITH max_val AS (
      SELECT COALESCE(MAX(current_seq), 1000) AS val FROM order_sequences
    )
    INSERT INTO order_sequences (order_date, current_seq)
    SELECT CURRENT_DATE, max_val.val + 1 FROM max_val
    ON CONFLICT (order_date)
    DO UPDATE SET current_seq = GREATEST(
      order_sequences.current_seq + 1,
      (SELECT COALESCE(MAX(current_seq), 1000) + 1 FROM order_sequences WHERE order_date <> CURRENT_DATE)
    )
    RETURNING current_seq;
  `;

  let candidate = '';
  let exists = true;

  while (exists) {
    const result = client ? await client.query(sql) : await query(sql);
    const seq = result.rows[0].current_seq;
    candidate = `${tablePrefix}-${seq}`;

    // Verify candidate is completely unique in orders table
    const checkSql = 'SELECT 1 FROM orders WHERE reference_no = $1 LIMIT 1';
    const checkRes = client ? await client.query(checkSql, [candidate]) : await query(checkSql, [candidate]);
    if (checkRes.rows.length === 0) {
      exists = false;
    }
  }

  return candidate;
}
