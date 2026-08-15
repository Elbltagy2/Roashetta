import * as FileSystem from 'expo-file-system/legacy';

const CANVAS_DIR = FileSystem.documentDirectory + 'canvases/';

export const CANVAS_FIELDS: { key: string; label: string }[] = [
  { key: 'chiefComplaintDrawing',     label: 'Chief Complaint' },
  { key: 'diagnosisDrawing',          label: 'Diagnosis' },
  { key: 'notesDrawing',              label: 'Notes Page 1' },
  { key: 'notesDrawing2',             label: 'Notes Page 2' },
  { key: 'notesDrawing3',             label: 'Notes Page 3' },
  { key: 'pastMedicalHistoryDrawing', label: 'Past Medical History' },
  { key: 'hpiDrawing',                label: 'HPI' },
  { key: 'drugHistoryDrawing',        label: 'Drug History' },
  { key: 'familyHistoryDrawing',      label: 'Family History' },
  { key: 'currentMedicationDrawing',  label: 'Current Medications' },
  { key: 'radiologyDrawing',          label: 'Radiology Request 1' },
  { key: 'radiologyDrawing2',         label: 'Radiology Request 2' },
  { key: 'radiologyDrawing3',         label: 'Radiology Request 3' },
];

const TEXT_MODE_PREFIX = 'TEXT_MODE:';

/**
 * Older records store the web app's display path ("/files/drawings/x.png")
 * instead of the storage path ("drawings/x.png"). Prefixing that with /files/
 * again produces /files/files/... which 404s, so strip it first.
 */
function storagePath(value: string): string {
  return value.replace(/^\/?files\//, '');
}

function stripDataUrl(value: string): string {
  return value.includes(',') ? value.split(',')[1] : value;
}

export async function clearCanvases(): Promise<void> {
  const info = await FileSystem.getInfoAsync(CANVAS_DIR);
  if (info.exists) await FileSystem.deleteAsync(CANVAS_DIR, { idempotent: true });
}

export async function visitCanvasesExist(visitId: string): Promise<boolean> {
  const dir = CANVAS_DIR + visitId + '/';
  const info = await FileSystem.getInfoAsync(dir);
  return info.exists;
}

export async function saveVisitCanvases(visitId: string, data: any, serverBaseUrl: string): Promise<void> {
  const dir = CANVAS_DIR + visitId + '/';
  let dirCreated = false;

  for (const { key } of CANVAS_FIELDS) {
    const value = data[key];
    if (!value || typeof value !== 'string' || value.length < 5) continue;

    if (!dirCreated) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      dirCreated = true;
    }

    const destPath = dir + key + '.png';
    try {
      if (value.startsWith('data:')) {
        // Raw base64 data URL
        await FileSystem.writeAsStringAsync(destPath, stripDataUrl(value), {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else if (value.startsWith(TEXT_MODE_PREFIX)) {
        // TEXT_MODE:{text, dataUrl} — save both text sidecar and image
        const parsed = JSON.parse(value.slice(TEXT_MODE_PREFIX.length));
        const text: string = parsed.text ?? '';
        if (text.trim()) {
          await FileSystem.writeAsStringAsync(dir + key + '.txt', text, {
            encoding: FileSystem.EncodingType.UTF8,
          });
        }
        const dataUrl: string = parsed.dataUrl ?? '';
        if (dataUrl.startsWith('data:')) {
          await FileSystem.writeAsStringAsync(destPath, stripDataUrl(dataUrl), {
            encoding: FileSystem.EncodingType.Base64,
          });
        } else if (dataUrl) {
          await FileSystem.downloadAsync(`${serverBaseUrl}/files/${storagePath(dataUrl)}`, destPath);
        }
      } else {
        // Relative file path e.g. "drawings/visitId_col.png"
        await FileSystem.downloadAsync(`${serverBaseUrl}/files/${storagePath(value)}`, destPath);
      }
    } catch { /* skip failed canvas field */ }
  }
}

export async function getVisitCanvases(
  visitId: string
): Promise<{ key: string; label: string; uri: string; text?: string }[]> {
  const dir = CANVAS_DIR + visitId + '/';
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) return [];

  const files = await FileSystem.readDirectoryAsync(dir);
  const result: { key: string; label: string; uri: string; text?: string }[] = [];

  for (const { key, label } of CANVAS_FIELDS) {
    if (files.includes(key + '.png')) {
      let text: string | undefined;
      if (files.includes(key + '.txt')) {
        try {
          text = await FileSystem.readAsStringAsync(dir + key + '.txt', {
            encoding: FileSystem.EncodingType.UTF8,
          });
        } catch { /* ignore */ }
      }
      result.push({ key, label, uri: dir + key + '.png', text });
    }
  }
  return result;
}
