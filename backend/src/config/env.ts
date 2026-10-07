import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:root@localhost:5433/bar_pos',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_bar_pos_jwt_key_2026_dev',
  nodeEnv: process.env.NODE_ENV || 'development'
};
