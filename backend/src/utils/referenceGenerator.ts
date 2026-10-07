import { PoolClient } from 'pg';
import { query } from '../database/db';

/**
 * Atomically generates a unique, human-friendly order reference number.
 * Format: T{tableNumber}-{sequence}
 * Example: T1-1001, T2-1002, T1-1003
 */
export async function generateOrderReference(tableNumber: string, client?: PoolClient): Promise<string> {
  const runner = client || { query };
  
  // Format table prefix: clean spaces or symbols
  const cleanTable = tableNumber.trim().toUpperCase();
  const tablePrefix = cleanTable.startsWith('T') ? cleanTable : `T${cleanTable}`;

  // Atomically increment daily sequence starting from 1001
  const sql = `
    INSERT INTO order_sequences (order_date, current_seq)
    VALUES (CURRENT_DATE, 1001)
    ON CONFLICT (order_date)
    DO UPDATE SET current_seq = order_sequences.current_seq + 1
    RETURNING current_seq;
  `;

  const result = client ? await client.query(sql) : await query(sql);
  const seq = result.rows[0].current_seq;

  return `${tablePrefix}-${seq}`;
}
