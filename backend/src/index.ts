import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './presentation/routes';
import { errorHandler } from './presentation/middleware/errorHandler';
import { initializeSocketServer } from './infrastructure/socket/socketServer';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = parseInt(process.env.PORT || '3000', 10);

// Initialize Socket.io
const io = initializeSocketServer(httpServer);

// Attach Socket.io instance to app for access in controllers
app.set('io', io);

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', routes);

// Error handler
app.use(errorHandler);

// Start server
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🏥 Roashetta API running on port ${PORT}`);
  console.log(`🔌 Socket.io server initialized`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📱 Network access: http://172.20.10.4:${PORT}/health`);
});

export default app;
