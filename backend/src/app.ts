import express from 'express';
import cors from 'cors';
import compression from 'compression';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Enable CORS for frontend applications (customer, POS, admin)
app.use(cors({
  origin: '*', // Allow localhost ports 3001, 3002, 3003 and electron app
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key']
}));

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Orders, inventory, sales, and authenticated responses must never be served
// stale from a browser or shared CDN cache.
app.use('/api/v1', (req, res, next) => {
  res.setHeader('Cache-Control', 'private, no-store');
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Mount v1 API routes
app.use('/api/v1', routes);

// Global Error Handler
app.use(errorHandler);

export default app;
