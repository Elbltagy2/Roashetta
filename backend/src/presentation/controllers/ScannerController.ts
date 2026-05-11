import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { discoverScanners } from '../../infrastructure/scanner/discovery';
import { scanDocument, getScannerStatus, bufferToDataUrl } from '../../infrastructure/scanner/eSCLClient';
import { SettingsRepository } from '../../infrastructure/repositories/SettingsRepository';
import { VisitRepository } from '../../infrastructure/repositories/VisitRepository';
import { VisitAttachmentRepository } from '../../infrastructure/repositories/VisitAttachmentRepository';

const settingsRepository = new SettingsRepository();
const visitRepository = new VisitRepository();
const attachmentRepository = new VisitAttachmentRepository();

export class ScannerController {
  async discover(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const scanners = await discoverScanners(4000);
      res.json(scanners);
    } catch (error) {
      next(error);
    }
  }

  async setDefault(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const doctorId = req.doctorId!;
      const { url, name } = req.body as { url?: string; name?: string };

      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'url is required' });
      }

      const existing = await settingsRepository.findByDoctorId(doctorId);
      const settings = await settingsRepository.upsert({
        doctorId,
        newVisitPrice: existing?.newVisitPrice ?? 0,
        followupVisitPrice: existing?.followupVisitPrice ?? 0,
        lastScannerUrl: url,
        lastScannerName: name ?? '',
      });

      res.json(settings);
    } catch (error) {
      next(error);
    }
  }

  async quickScan(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const doctorId = req.doctorId!;
      const { visitId } = req.params;
      const {
        url: overrideUrl,
        resolution,
        colorMode,
        source,
        format,
      } = req.body as {
        url?: string;
        resolution?: number;
        colorMode?: 'RGB24' | 'Grayscale8' | 'BlackAndWhite1';
        source?: 'Platen' | 'Feeder';
        format?: 'image/jpeg' | 'application/pdf';
      };

      const visit = await visitRepository.findById(visitId);
      if (!visit || visit.doctorId !== doctorId) {
        return res.status(404).json({ error: 'Visit not found' });
      }

      let scannerUrl = overrideUrl;
      let scannerName = '';

      if (!scannerUrl) {
        const settings = await settingsRepository.findByDoctorId(doctorId);
        scannerUrl = settings?.lastScannerUrl;
        scannerName = settings?.lastScannerName ?? '';
      }

      // If no saved scanner, or saved one is unreachable, try mDNS discovery
      if (scannerUrl) {
        const status = await getScannerStatus(scannerUrl);
        if (!status.ok) {
          scannerUrl = undefined;
        }
      }

      if (!scannerUrl) {
        const found = await discoverScanners(4000);
        if (found.length === 0) {
          return res.status(503).json({
            error: 'No network scanner found on the local network. Make sure the scanner is powered on and connected to the same WiFi.',
          });
        }
        scannerUrl = found[0].url;
        scannerName = found[0].name;
      }

      const result = await scanDocument({
        baseUrl: scannerUrl,
        resolution: resolution ?? 300,
        colorMode: colorMode ?? 'RGB24',
        source: source ?? 'Platen',
        format: format ?? 'image/jpeg',
      });

      const dataUrl = bufferToDataUrl(result.buffer, result.contentType);
      const fileExt = result.contentType.includes('pdf') ? 'pdf' : 'jpg';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

      const attachment = await attachmentRepository.create({
        visitId,
        name: `Scan-${timestamp}.${fileExt}`,
        type: result.contentType,
        dataUrl,
        uploadedBy: req.user!.id,
        uploaderType: req.user!.role as 'doctor' | 'assistant',
      });

      // Persist the scanner URL for next time (silent best-effort)
      try {
        const existing = await settingsRepository.findByDoctorId(doctorId);
        await settingsRepository.upsert({
          doctorId,
          newVisitPrice: existing?.newVisitPrice ?? 0,
          followupVisitPrice: existing?.followupVisitPrice ?? 0,
          lastScannerUrl: scannerUrl,
          lastScannerName: scannerName || existing?.lastScannerName || '',
        });
      } catch { /* non-fatal */ }

      res.status(201).json({ attachment, scanner: { url: scannerUrl, name: scannerName } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Scan failed';
      res.status(502).json({ error: message });
    }
  }
}
