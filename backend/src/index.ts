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
import { validateLicenseKey } from './utils/license';
import { updater } from './infrastructure/updater/Updater';
import { APP_VERSION } from './utils/version';

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

// Static assets (JS, CSS with hash) - cache for 1 year
app.use('/assets', express.static(path.join(frontendPath, 'assets'), {
  maxAge: '1y',
  immutable: true,
}));

// Other static files - no cache
app.use(express.static(frontendPath, {
  etag: false,
  lastModified: false,
  setHeaders: (res, filePath) => {
    // Don't cache HTML files
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  },
}));

// All non-API routes serve the React app (with no-cache headers)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
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

// License info to display
let licenseInfo: { clinicName: string; expiryDate: string; maxDoctors: number } | null = null;

// Start server
async function startServer() {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Check license key (skip in development mode)
    if (!isDevelopment) {
      const licenseKey = process.env.LICENSE_KEY;
      if (!licenseKey) {
        console.error('\n========================================');
        console.error('  ❌ LICENSE ERROR');
        console.error('========================================');
        console.error('\n  No license key found!');
        console.error('  Please add LICENSE_KEY to your .env file\n');
        console.error('  Contact support to obtain a license key.');
        console.error('\n========================================\n');
        process.exit(1);
      }

      const licenseResult = validateLicenseKey(licenseKey);
      if (!licenseResult.valid) {
        console.error('\n========================================');
        console.error('  ❌ LICENSE ERROR');
        console.error('========================================');
        console.error(`\n  ${licenseResult.error}\n`);
        console.error('  Please contact support for assistance.');
        console.error('\n========================================\n');
        process.exit(1);
      }

      licenseInfo = licenseResult.data!;
    } else {
      console.log('\n⚠️  Development mode - License check skipped\n');
    }

    // Initialize SQLite database (async for sql.js)
    await initializeDatabase();

    httpServer.listen(PORT, '0.0.0.0', () => {
      const localIP = getLocalIPAddress();
      const networkURL = `http://${localIP}:${PORT}`;
      const localURL = `http://localhost:${PORT}`;

      console.log('\n========================================');
      console.log('  🏥 Roashetta Server Started');
      console.log('========================================\n');
      if (licenseInfo) {
        console.log(`🏢 Licensed to: ${licenseInfo.clinicName}`);
        console.log(`📅 License expires: ${licenseInfo.expiryDate === 'lifetime' ? 'Never (Lifetime)' : licenseInfo.expiryDate}`);
        console.log(`👥 Max doctors: ${licenseInfo.maxDoctors === -1 ? 'Unlimited' : licenseInfo.maxDoctors}\n`);
      }
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

      // Non-blocking update check on startup
      console.log(`📦 App version: ${APP_VERSION}`);
      if (process.env.UPDATE_MANIFEST_URL) {
        updater
          .checkForUpdates()
          .then((state) => {
            if (state.manifest && updater.isUpdateAvailable()) {
              console.log(
                `🆕 Update available: ${APP_VERSION} → ${state.manifest.version}`
              );
            } else if (state.lastCheckError) {
              console.log(`⚠️  Update check failed: ${state.lastCheckError}`);
            } else {
              console.log('✅ App is up to date');
            }
          })
          .catch(() => {
            // already swallowed inside checkForUpdates
          });
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

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception — saving database before exit:', err);
  closeDatabase();
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection — saving database before exit:', reason);
  closeDatabase();
  process.exit(1);
});

// Start the server
startServer();

export default app;
