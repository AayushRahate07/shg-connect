import express from 'express';
import cors from 'cors';
import syncRouter from './routes/sync';
import { errorHandler } from './middleware/errorHandler';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Sync API V1
app.use('/api/v1/sync', syncRouter);

// Centralized Error Handler
app.use(errorHandler);
