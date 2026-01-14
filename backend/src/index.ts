import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import os from 'os';
import { exec } from 'child_process';
import routes from './presentation/routes';
import { errorHandler } from './presentation/middleware/errorHandler';
import { initializeSocketServer } from './infrastructure/socket/socketServer';
import { initializeDatabase, closeDatabase } from './infrastructure/database/config';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = parseInt(process.env.PORT || '3000', 10);

// Initialize Socket.io
const io = initializeSocketServer(httpServer);

// Attach Socket.io instance to app for access in controllers
app.set('io', io);

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin, mobile apps, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all for packaged app
  },
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

// Serve frontend static files (for production .exe)
const frontendPath = path.join(__dirname, '..', 'public');
app.use(express.static(frontendPath));

// All non-API routes serve the React app
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handler
app.use(errorHandler);

// Get local IP address
function getLocalIPAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Open browser
function openBrowser(url: string) {
  const command = process.platform === 'win32' ? 'start' :
                  process.platform === 'darwin' ? 'open' : 'xdg-open';
  exec(`${command} ${url}`, (error) => {
    if (error) {
      console.log(`⚠️  Could not auto-open browser: ${error.message}`);
    }
  });
}

// Start server
async function startServer() {
  try {
    // Initialize SQLite database (async for sql.js)
    await initializeDatabase();

    httpServer.listen(PORT, '0.0.0.0', () => {
      const localIP = getLocalIPAddress();
      const networkURL = `http://${localIP}:${PORT}`;
      const localURL = `http://localhost:${PORT}`;

      console.log('\n========================================');
      console.log('  🏥 Roashetta Server Started');
      console.log('========================================\n');
      console.log(`💾 Database: roashetta.db`);
      console.log(`🔌 Socket.io: Enabled\n`);
      console.log('📍 Access URLs:');
      console.log(`   Local:   ${localURL}`);
      console.log(`   Network: ${networkURL}\n`);
      console.log('📱 Share the Network URL to access from other devices');
      console.log('   on the same WiFi network\n');
      console.log('========================================\n');

      // Auto-open browser (optional - controlled by env var)
      if (process.env.AUTO_OPEN_BROWSER === 'true') {
        console.log('🌐 Opening browser...\n');
        openBrowser(localURL);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  closeDatabase();
  process.exit(0);
});

// Start the server
startServer();

export default app;
