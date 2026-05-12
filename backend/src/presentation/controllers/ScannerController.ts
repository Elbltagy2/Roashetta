import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { discoverScanners } from '../../infrastructure/scanner/discovery';
import { scanDocument, getScannerStatus, bufferToDataUrl } from '../../infrastructure/scanner/eSCLClient';
import { SettingsRepository } from '../../infrastructure/repositories/SettingsRepository';
import { VisitRepository } from '../../infrastructure/repositories/VisitRepository';
import { VisitAttachmentRepository } from '../../infrastructure/repositories/VisitAttachmentRepository';
import { PatientRepository } from '../../infrastructure/repositories/PatientRepository';
import { PatientRecordRepository } from '../../infrastructure/repositories/PatientRecordRepository';
import { PreviousInvestigationRepository } from '../../infrastructure/repositories/PreviousInvestigationRepository';

const settingsRepository = new SettingsRepository();
const visitRepository = new VisitRepository();
const attachmentRepository = new VisitAttachmentRepository();
const patientRepository = new PatientRepository();
const patientRecordRepository = new PatientRecordRepository();
const previousInvestigationRepository = new PreviousInvestigationRepository();

interface ScanOptions {
  url?: string;
  resolution?: number;
  colorMode?: 'RGB24' | 'Grayscale8' | 'BlackAndWhite1';
  source?: 'Platen' | 'Feeder';
  format?: 'image/jpeg' | 'application/pdf';
}

// Shared helper: resolves a scanner URL (preferring the saved default,
// falling back to mDNS discovery), then performs a scan and returns the
// captured buffer along with the scanner that was used.
async function performScan(doctorId: string, opts: ScanOptions) {
  let scannerUrl = opts.url;
  let scannerName = '';

  if (!scannerUrl) {
    const settings = await settingsRepository.findByDoctorId(doctorId);
    scannerUrl = settings?.lastScannerUrl;
    scannerName = settings?.lastScannerName ?? '';
  }

  if (scannerUrl) {
    const status = await getScannerStatus(scannerUrl);
    if (!status.ok) scannerUrl = undefined;
  }

  if (!scannerUrl) {
    const found = await discoverScanners(4000);
    if (found.length === 0) {
      const err = new Error(
        'No network scanner found on the local network. Make sure the scanner is powered on and connected to the same WiFi.'
      );
      (err as Error & { code?: string }).code = 'NO_SCANNER';
      throw err;
    }
    scannerUrl = found[0].url;
    scannerName = found[0].name;
  }

  const result = await scanDocument({
    baseUrl: scannerUrl,
    resolution: opts.resolution ?? 300,
    colorMode: opts.colorMode ?? 'RGB24',
    source: opts.source ?? 'Platen',
    format: opts.format ?? 'image/jpeg',
  });

  // Persist scanner URL for next time (silent best-effort)
  try {
    const existing = await settingsRepository.findByDoctorId(doctorId);
    await settingsRepository.upsert({
      doctorId,
      newVisitPrice: existing?.newVisitPrice ?? 0,
      followupVisitPrice: existing?.followupVisitPrice ?? 0,
      lastScannerUrl: scannerUrl,
      lastScannerName: scannerName || existing?.lastScannerName || '',
    });
  } catch {
    // non-fatal
  }

  return { result, scannerUrl, scannerName };
}

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
      const opts = req.body as ScanOptions;

      const visit = await visitRepository.findById(visitId);
      if (!visit || visit.doctorId !== doctorId) {
        return res.status(404).json({ error: 'Visit not found' });
      }

      const { result, scannerUrl, scannerName } = await performScan(doctorId, opts);
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

      res.status(201).json({ attachment, scanner: { url: scannerUrl, name: scannerName } });
    } catch (error) {
      const code = (error as Error & { code?: string })?.code;
      const status = code === 'NO_SCANNER' ? 503 : 502;
      const message = error instanceof Error ? error.message : 'Scan failed';
      res.status(status).json({ error: message });
    }
  }

  // Scan and save directly to a patient's records.
  async scanToPatientRecord(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const doctorId = req.doctorId!;
      const { patientId } = req.params;
      const opts = req.body as ScanOptions;

      const patient = await patientRepository.findById(patientId);
      if (!patient || patient.doctorId !== doctorId) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      const { result, scannerUrl, scannerName } = await performScan(doctorId, opts);
      const dataUrl = bufferToDataUrl(result.buffer, result.contentType);
      const fileExt = result.contentType.includes('pdf') ? 'pdf' : 'jpg';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

      const record = await patientRecordRepository.create({
        patientId,
        name: `Scan-${timestamp}.${fileExt}`,
        fileType: result.contentType,
        fileUrl: dataUrl,
        fileSize: result.buffer.byteLength,
      });

      res.status(201).json({ record, scanner: { url: scannerUrl, name: scannerName } });
    } catch (error) {
      const code = (error as Error & { code?: string })?.code;
      const status = code === 'NO_SCANNER' ? 503 : 502;
      const message = error instanceof Error ? error.message : 'Scan failed';
      res.status(status).json({ error: message });
    }
  }

  // Scan and save directly to a patient's previous investigations.
  async scanToPreviousInvestigation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const doctorId = req.doctorId!;
      const { patientId } = req.params;
      const opts = req.body as ScanOptions;

      const patient = await patientRepository.findById(patientId);
      if (!patient || patient.doctorId !== doctorId) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      const { result, scannerUrl, scannerName } = await performScan(doctorId, opts);
      const dataUrl = bufferToDataUrl(result.buffer, result.contentType);
      const fileExt = result.contentType.includes('pdf') ? 'pdf' : 'jpg';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

      const investigation = await previousInvestigationRepository.create({
        patientId,
        name: `Scan-${timestamp}.${fileExt}`,
        fileType: result.contentType,
        fileUrl: dataUrl,
        fileSize: result.buffer.byteLength,
      });

      res.status(201).json({ investigation, scanner: { url: scannerUrl, name: scannerName } });
    } catch (error) {
      const code = (error as Error & { code?: string })?.code;
      const status = code === 'NO_SCANNER' ? 503 : 502;
      const message = error instanceof Error ? error.message : 'Scan failed';
      res.status(status).json({ error: message });
    }
  }
}
