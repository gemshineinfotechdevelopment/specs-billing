import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load server .env (works whether run from root or inside server/ folder)
const currentDir = path.resolve(import.meta.dirname || '.');
const serverEnvPath = fs.existsSync(path.join(currentDir, '.env'))
  ? path.join(currentDir, '.env')
  : path.resolve(process.cwd(), 'server', '.env');
if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
}
dotenv.config();

import { productsRouter } from './routes/products.routes.js';
import { customersRouter } from './routes/customers.routes.js';
import { invoicesRouter } from './routes/invoices.routes.js';
import { settingsRouter } from './routes/settings.routes.js';
import { reportsRouter } from './routes/reports.routes.js';
import { aiRouter } from './routes/ai.routes.js';
import { db } from './data/store.js';

const app = express();
const PORT = Number(process.env.PORT) || 5026;
const CLIENT_URL = process.env.CLIENT_URL || 'https://specs-billing.gemshine.tech';

// Connect to MongoDB (with graceful fallback to JSON store)
db.connectMongo().catch((err) => {
  console.warn('MongoDB connection notice:', err.message);
});

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, postman, server-to-server) or matching domain
      if (
        !origin ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1') ||
        origin.includes('specs-billing.gemshine.tech') ||
        origin === CLIENT_URL
      ) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in production behind Nginx reverse-proxy
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  const mongoStatus = db.getMongoStatus();
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'LuminaOptic Billing POS Server',
    port: PORT,
    database: {
      type: mongoStatus.connected ? 'mongodb' : 'json-file',
      mongodbConnected: mongoStatus.connected,
      mongodbUri: mongoStatus.uri,
      products: db.getProducts().length,
      customers: db.getCustomers().length,
      invoices: db.getInvoices().length,
    },
  });
});

// Mount API routes
app.use('/api/products', productsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/ai', aiRouter);

// Serve static frontend in production if dist exists
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global 404 handler for API
app.use('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start listening
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 LuminaOptic Server running on: http://0.0.0.0:${PORT}`);
  console.log(`🔌 Health check available at:     http://localhost:${PORT}/api/health`);
  console.log(`🌐 Subdomain configured for:      https://specs-billing.gemshine.tech`);
  console.log(`💻 Connected to client on:        ${CLIENT_URL}`);
  console.log(`======================================================\n`);
});

// Graceful Shutdown
const handleGracefulShutdown = () => {
  console.log('\n🛑 Receiving shutdown signal. Closing HTTP server gracefully...');
  server.close(() => {
    console.log('✅ LuminaOptic Server closed.');
    process.exit(0);
  });
};
process.on('SIGTERM', handleGracefulShutdown);
process.on('SIGINT', handleGracefulShutdown);

export default app;
