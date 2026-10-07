import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { pool, query } from './db';

export async function initializeDatabase() {
  console.log('🔄 Initializing database schema and seed data...');
  try {
    const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      // Split commands or execute pool query
      await query(sql);
      console.log('✅ Schema tables executed successfully.');
    } else {
      console.warn('⚠️ schema.sql not found at', schemaPath);
    }

    // Seed default admin and cashier if not existing
    const adminCheck = await query('SELECT id FROM users WHERE username = $1', ['admin']);
    if (adminCheck.rows.length === 0) {
      const adminHash = await bcrypt.hash('admin123', 10);
      await query(
        `INSERT INTO users (username, password_hash, full_name, role, is_active)
         VALUES ($1, $2, $3, $4, true)`,
        ['admin', adminHash, 'Bar Administrator', 'admin']
      );
      console.log('✅ Created default admin account (user: admin, pass: admin123)');
    }

    const cashierCheck = await query('SELECT id FROM users WHERE username = $1', ['cashier']);
    if (cashierCheck.rows.length === 0) {
      const cashierHash = await bcrypt.hash('cashier123', 10);
      await query(
        `INSERT INTO users (username, password_hash, full_name, role, is_active)
         VALUES ($1, $2, $3, $4, true)`,
        ['cashier', cashierHash, 'Front Counter Cashier', 'cashier']
      );
      console.log('✅ Created default cashier account (user: cashier, pass: cashier123)');
    }

    // Seed product images
    const { seedProductImages } = await import('./seed_images.js');
    await seedProductImages();

    console.log('🎉 Database initialization complete!');
  } catch (err: any) {
    console.error('❌ Error initializing database:', err);
    throw err;
  }
}

// Allow direct execution
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database init script finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Database init script failed:', err);
      process.exit(1);
    });
}
