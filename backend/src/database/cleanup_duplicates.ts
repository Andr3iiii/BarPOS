import { query } from './db.js';

export async function deduplicateProducts() {
  console.log('🧹 Cleaning up duplicate products...');

  // Map each product name to its canonical (lowest) id
  const canonicalRows = await query(`
    SELECT name, min(id) as canonical_id 
    FROM products 
    GROUP BY name
  `);

  for (const row of canonicalRows.rows) {
    const { name, canonical_id } = row;
    // Remap any order items referencing duplicates
    await query(`
      UPDATE order_items 
      SET product_id = $1 
      WHERE product_id IN (SELECT id FROM products WHERE name = $2 AND id != $1)
    `, [canonical_id, name]);

    // Delete duplicates
    await query(`
      DELETE FROM products 
      WHERE name = $1 AND id != $2
    `, [name, canonical_id]);
  }

  // Ensure unique constraint exists
  try {
    await query(`
      ALTER TABLE products ADD CONSTRAINT products_name_key UNIQUE (name);
    `);
    console.log('✅ Added UNIQUE constraint to products(name)');
  } catch (err: any) {
    if (err.message?.includes('already exists')) {
      console.log('ℹ️ Constraint products_name_key already exists');
    } else {
      console.warn('⚠️ Could not add constraint:', err.message);
    }
  }

  const countResult = await query('SELECT count(*) FROM products');
  console.log(`✅ Deduplication complete. Total unique products: ${countResult.rows[0].count}`);
}

if (require.main === module) {
  deduplicateProducts()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
