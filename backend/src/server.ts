import app from './app';
import { config } from './config/env';
import { query } from './database/db';
import { initializeDatabase } from './database/init';

async function startServer() {
  try {
    console.log('⏳ Connecting to PostgreSQL database...');
    const dbTest = await query('SELECT NOW()');
    console.log('✅ PostgreSQL connected successfully at:', dbTest.rows[0].now);

    // Initialize tables and initial seed data if needed
    await initializeDatabase();

    app.listen(config.port, () => {
      console.log(`🚀 Bar POS Backend API server is running on http://localhost:${config.port}`);
      console.log(`📡 API Endpoints base URL: http://localhost:${config.port}/api/v1`);
    });
  } catch (err: any) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();
