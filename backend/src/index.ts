import express from 'express';
import http from 'http';
import net from 'net';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import os from 'os';
import { exec } from 'child_process';
import routes from './presentation/routes';
import { errorHandler } from './presentation/middleware/errorHandler';
import { initializeSocketServer } from './infrastructure/socket/socketServer';
import { initializeDatabase, closeDatabase, getStorageDir, backupToUsb } from './infrastructure/database/config';
import { validateLicenseKey } from './utils/license';
import { updater } from './infrastructure/updater/Updater';
import { APP_VERSION } from './utils/version';

dotenv.config();

// ── Single-instance lock ─────────────────────────────────────────────────────
// Prevents two copies of the exe from running at the same time.
// Two instances both load the database into memory independently, so whichever
// saves last silently overwrites the other's data.
declare const process: NodeJS.Process & { pkg?: boolean };

const lockPath = (() => {
  if (process.env.DATABASE_PATH)
    return path.join(path.dirname(path.resolve(process.env.DATABASE_PATH)), 'roashetta.lock');
  if (process.pkg)
    return path.join(path.dirname(process.execPath), 'roashetta.lock');
  return path.join(__dirname, '..', '..', '..', 'roashetta.lock');
})();

function acquireLock(): void {
  if (fs.existsSync(lockPath)) {
    const raw = fs.readFileSync(lockPath, 'utf8').trim();
    const existingPid = parseInt(raw, 10);
    if (!isNaN(existingPid)) {
      try {
        process.kill(existingPid, 0); // throws if process is gone
        console.error('\n========================================');
        console.error('  ❌ ALREADY RUNNING');
        console.error('========================================');
        console.error(`\n  Roashetta is already open (PID ${existingPid}).`);
        console.error('  Close the other window first, then try again.\n');
        console.error('========================================\n');
        process.exit(1);
      } catch {
        // Stale lock from a previous crash — clean it up and continue
        console.log('Stale lock file found, starting fresh...');
      }
    }
  }
  fs.writeFileSync(lockPath, String(process.pid));
}

function releaseLock(): void {
  try { fs.unlinkSync(lockPath); } catch { /* ignore */ }
}
// ────────────────────────────────────────────────────────────────────────────

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
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', routes);

// Serve uploaded files (images, PDFs, drawings) stored outside the database
app.use('/files', express.static(getStorageDir(), { maxAge: '7d', fallthrough: false }));

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

function isPortInUse(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const tester = net.createServer()
      .once('error', () => resolve(true))
      .once('listening', () => { tester.close(); resolve(false); })
      .listen(port, '127.0.0.1');
  });
}

// Start server
async function startServer() {
  try {
    // Block if another instance (even old versions without a lock) is already running
    if (await isPortInUse(PORT)) {
      console.error('\n========================================');
      console.error('  ❌ ALREADY RUNNING');
      console.error('========================================');
      console.error(`\n  Another Roashetta server is already using port ${PORT}.`);
      console.error('  Close the other window first, then try again.\n');
      console.error('========================================\n');
      process.exit(1);
    }

    acquireLock();

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

// Always save database and release lock on any exit
process.on('exit', () => {
  closeDatabase();
  releaseLock();
});

// Graceful shutdown — export to USB (end of day) before closing the DB.
async function shutdown(signal: string): Promise<void> {
  console.log(`\nShutting down gracefully (${signal})...`);
  try { await backupToUsb(); } catch { /* backupToUsb already logs; never block exit */ }
  closeDatabase();
  releaseLock();
  process.exit(0);
}

process.on('SIGINT', () => { shutdown('SIGINT'); });
process.on('SIGTERM', () => { shutdown('SIGTERM'); });

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception — saving database before exit:', err);
  closeDatabase();
  releaseLock();
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection — saving database before exit:', reason);
  closeDatabase();
  releaseLock();
  process.exit(1);
});

// Start the server
startServer();

export default app;
