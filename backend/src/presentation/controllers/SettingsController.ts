import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { SettingsRepository } from '../../infrastructure/repositories/SettingsRepository';
import { cache, cacheKeys } from '../../infrastructure/cache/MemoryCache';
import { backupToUsb } from '../../infrastructure/database/config';
import fs from 'fs';
import path from 'path';

const settingsRepository = new SettingsRepository();

export class SettingsController {
  async get(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const doctorId = req.doctorId!;

      const cacheKey = cacheKeys.settings(doctorId);
      const cached = cache.get<unknown>(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const settings = await settingsRepository.findByDoctorId(doctorId);

      const payload = settings ?? {
        doctorId,
        newVisitPrice: 0,
        followupVisitPrice: 0,
        backupPath: '',
      };

      cache.set(cacheKey, payload);
      res.json(payload);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const doctorId = req.doctorId!;
      const { newVisitPrice, followupVisitPrice, consultationPrice, backupPath } = req.body;

      const existing = await settingsRepository.findByDoctorId(doctorId);

      const settings = await settingsRepository.upsert({
        doctorId,
        newVisitPrice: newVisitPrice ?? existing?.newVisitPrice ?? 0,
        followupVisitPrice: followupVisitPrice ?? existing?.followupVisitPrice ?? 0,
        consultationPrice: consultationPrice ?? existing?.consultationPrice ?? 0,
        backupPath: backupPath ?? existing?.backupPath ?? '',
      });

      cache.delete(cacheKeys.settings(doctorId));

      res.json(settings);
    } catch (error) {
      next(error);
    }
  }

  // Runs a full backup (database + uploaded files) to the configured folder now.
  async backupNow(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await backupToUsb();
      res.status(result.ok ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Server-side folder browser for picking the backup destination.
  // The server runs on the clinic machine itself, so it can see the real
  // filesystem (USB drives included) — the browser sandbox can't.
  async browseFolders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const requested = typeof req.query.path === 'string' ? req.query.path : '';

      // No path → list drive roots (Windows drive letters / mounted volumes).
      if (!requested) {
        return res.json({ path: '', parent: null, dirs: listDriveRoots() });
      }

      const current = path.resolve(requested);
      if (!fs.existsSync(current) || !fs.statSync(current).isDirectory()) {
        return res.status(400).json({ error: `Folder not found: ${current}` });
      }

      const dirs: { name: string; path: string }[] = [];
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
        const full = path.join(current, entry.name);
        try { fs.readdirSync(full); } catch { continue; } // skip unreadable (system) folders
        dirs.push({ name: entry.name, path: full });
      }
      dirs.sort((a, b) => a.name.localeCompare(b.name));

      // At a drive root, "up" goes back to the drive list ('' sentinel).
      const parentDir = path.dirname(current);
      const parent = parentDir === current ? '' : parentDir;

      res.json({ path: current, parent, dirs });
    } catch (error) {
      next(error);
    }
  }
}

// Top-level entry points of the filesystem: drive letters on Windows,
// mounted volumes (USB sticks land here) on macOS/Linux.
function listDriveRoots(): { name: string; path: string }[] {
  const roots: { name: string; path: string }[] = [];
  if (process.platform === 'win32') {
    for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      const p = `${letter}:\\`;
      try { if (fs.existsSync(p)) roots.push({ name: p, path: p }); } catch { /* skip */ }
    }
    return roots;
  }
  const mountBases = process.platform === 'darwin' ? ['/Volumes'] : ['/media', '/mnt'];
  for (const base of mountBases) {
    try {
      for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
        if (entry.isDirectory() || entry.isSymbolicLink()) {
          roots.push({ name: entry.name, path: path.join(base, entry.name) });
        }
      }
    } catch { /* base doesn't exist */ }
  }
  roots.push({ name: '/', path: '/' });
  return roots;
}
