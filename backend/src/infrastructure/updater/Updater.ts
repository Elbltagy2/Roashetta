import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { APP_VERSION, isNewerVersion } from '../../utils/version';

export interface UpdateManifest {
  version: string;
  downloadUrl: string;
  sha256: string;
  releasedAt?: string;
  notes?: string;
  minVersion?: string;
}

export type DownloadStatus =
  | { state: 'idle' }
  | { state: 'downloading'; receivedBytes: number; totalBytes: number }
  | { state: 'downloaded'; path: string }
  | { state: 'error'; message: string };

export interface UpdateState {
  currentVersion: string;
  manifest: UpdateManifest | null;
  lastCheckedAt: string | null;
  lastCheckError: string | null;
  downloadStatus: DownloadStatus;
  pendingRestart: boolean;
}

function getInstallDir(): string {
  // process.execPath is the running executable on pkg-packaged builds.
  // In dev (`ts-node-dev`), fall back to the cwd so the updater still works.
  const exec = process.execPath;
  if (exec.includes('node')) return process.cwd();
  return path.dirname(exec);
}

function getRunningExePath(): string {
  return process.execPath;
}

function getPendingExePath(): string {
  return path.join(getInstallDir(), 'RoashettaServer.exe.new');
}

class UpdaterClass {
  private state: UpdateState = {
    currentVersion: APP_VERSION,
    manifest: null,
    lastCheckedAt: null,
    lastCheckError: null,
    downloadStatus: { state: 'idle' },
    pendingRestart: false,
  };

  private get manifestUrl(): string | null {
    return process.env.UPDATE_MANIFEST_URL || null;
  }

  getState(): UpdateState {
    // If a previous run already downloaded the new exe, surface that.
    if (this.state.downloadStatus.state === 'idle') {
      const pending = getPendingExePath();
      if (fs.existsSync(pending)) {
        return {
          ...this.state,
          downloadStatus: { state: 'downloaded', path: pending },
        };
      }
    }
    return { ...this.state };
  }

  isUpdateAvailable(): boolean {
    const m = this.state.manifest;
    if (!m) return false;
    return isNewerVersion(APP_VERSION, m.version);
  }

  async checkForUpdates(): Promise<UpdateState> {
    const url = this.manifestUrl;
    if (!url) {
      this.state.lastCheckError = 'UPDATE_MANIFEST_URL not configured';
      this.state.lastCheckedAt = new Date().toISOString();
      return this.getState();
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Manifest HTTP ${res.status}`);
      }

      const manifest = (await res.json()) as UpdateManifest;
      if (!manifest.version || !manifest.downloadUrl || !manifest.sha256) {
        throw new Error('Invalid manifest: missing required fields');
      }

      this.state.manifest = manifest;
      this.state.lastCheckedAt = new Date().toISOString();
      this.state.lastCheckError = null;
    } catch (err) {
      this.state.lastCheckError =
        err instanceof Error ? err.message : String(err);
      this.state.lastCheckedAt = new Date().toISOString();
    }

    return this.getState();
  }

  async downloadUpdate(): Promise<UpdateState> {
    const manifest = this.state.manifest;
    if (!manifest) {
      this.state.downloadStatus = {
        state: 'error',
        message: 'No manifest available — run check first',
      };
      return this.getState();
    }

    if (!this.isUpdateAvailable()) {
      this.state.downloadStatus = {
        state: 'error',
        message: 'Already on the latest version',
      };
      return this.getState();
    }

    if (this.state.downloadStatus.state === 'downloading') {
      return this.getState();
    }

    const dest = getPendingExePath();
    const tmp = `${dest}.partial`;

    try {
      this.state.downloadStatus = {
        state: 'downloading',
        receivedBytes: 0,
        totalBytes: 0,
      };

      const res = await fetch(manifest.downloadUrl);
      if (!res.ok || !res.body) {
        throw new Error(`Download HTTP ${res.status}`);
      }

      const totalBytes = Number(res.headers.get('content-length') || '0');
      const fileStream = fs.createWriteStream(tmp);
      const hash = crypto.createHash('sha256');

      let received = 0;
      const reader = res.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          hash.update(value);
          fileStream.write(value);
          received += value.byteLength;
          this.state.downloadStatus = {
            state: 'downloading',
            receivedBytes: received,
            totalBytes,
          };
        }
      }
      await new Promise<void>((resolve, reject) => {
        fileStream.end((err?: NodeJS.ErrnoException | null) =>
          err ? reject(err) : resolve()
        );
      });

      const actualHash = hash.digest('hex').toLowerCase();
      const expectedHash = manifest.sha256.toLowerCase();
      if (actualHash !== expectedHash) {
        fs.unlinkSync(tmp);
        throw new Error(
          `SHA-256 mismatch (expected ${expectedHash.slice(0, 12)}…, got ${actualHash.slice(0, 12)}…)`
        );
      }

      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      fs.renameSync(tmp, dest);

      this.state.downloadStatus = { state: 'downloaded', path: dest };
      this.state.pendingRestart = true;
    } catch (err) {
      this.state.downloadStatus = {
        state: 'error',
        message: err instanceof Error ? err.message : String(err),
      };
      try {
        if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      } catch {
        // ignore cleanup errors
      }
    }

    return this.getState();
  }

  // Schedules a graceful shutdown. The StartRoashetta.bat launcher will see
  // RoashettaServer.exe.new on disk and swap it in before relaunching.
  scheduleRestart(): void {
    setTimeout(() => {
      console.log('[Updater] Restarting to apply update…');
      process.exit(0);
    }, 500);
  }

  // Path debug info (handy for the frontend).
  getPaths() {
    return {
      installDir: getInstallDir(),
      runningExe: getRunningExePath(),
      pendingExe: getPendingExePath(),
    };
  }
}

export const updater = new UpdaterClass();
