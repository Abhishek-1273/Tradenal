import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

import { env } from './config/env';
import { apiLimiter } from './middleware/rateLimit.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';

import authRoutes from './modules/auth/auth.routes';
import tradeRoutes from './modules/trades/trade.routes';
import statsRoutes from './modules/stats/stats.routes';
import goalsRoutes from './modules/goals/goals.routes';
import aiRoutes from './modules/ai/ai.routes';
import exportRoutes from './modules/export/export.routes';
import accountRoutes from './modules/accounts/account.routes';

const app: Application = express();

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.NODE_ENV === 'production' ? env.CLIENT_URL : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ─── Body Parser ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Static files upload directory ───────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Request Logging ──────────────────────────────────────────────────────────
if (env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: { write: (message) => logger.info(message.trim()) },
    })
  );
}

// ─── Global Rate Limit ────────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/accounts', accountRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
