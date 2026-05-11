export interface ScanOptions {
  baseUrl: string;
  resolution?: number;
  colorMode?: 'RGB24' | 'Grayscale8' | 'BlackAndWhite1';
  format?: 'image/jpeg' | 'application/pdf';
  source?: 'Platen' | 'Feeder';
  widthUnits?: number;
  heightUnits?: number;
}

export interface ScanResult {
  buffer: Buffer;
  contentType: string;
}

const A4_WIDTH_300THS = 2480;
const A4_HEIGHT_300THS = 3508;

function trimSlash(s: string): string {
  return s.replace(/\/+$/, '');
}

function buildScanSettings(opts: ScanOptions): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<scan:ScanSettings xmlns:scan="http://schemas.hp.com/imaging/escl/2011/05/03"
                   xmlns:pwg="http://www.pwg.org/schemas/2010/12/sm">
  <pwg:Version>2.0</pwg:Version>
  <pwg:ScanRegions>
    <pwg:ScanRegion>
      <pwg:ContentRegionUnits>escl:ThreeHundredthsOfInches</pwg:ContentRegionUnits>
      <pwg:Width>${opts.widthUnits ?? A4_WIDTH_300THS}</pwg:Width>
      <pwg:Height>${opts.heightUnits ?? A4_HEIGHT_300THS}</pwg:Height>
      <pwg:XOffset>0</pwg:XOffset>
      <pwg:YOffset>0</pwg:YOffset>
    </pwg:ScanRegion>
  </pwg:ScanRegions>
  <pwg:InputSource>${opts.source ?? 'Platen'}</pwg:InputSource>
  <scan:ColorMode>${opts.colorMode ?? 'RGB24'}</scan:ColorMode>
  <scan:XResolution>${opts.resolution ?? 300}</scan:XResolution>
  <scan:YResolution>${opts.resolution ?? 300}</scan:YResolution>
  <scan:DocumentFormatExt>${opts.format ?? 'image/jpeg'}</scan:DocumentFormatExt>
</scan:ScanSettings>`;
}

export async function getScannerStatus(baseUrl: string, timeoutMs = 4000): Promise<{ ok: boolean; state?: string }> {
  const url = `${trimSlash(baseUrl)}/ScannerStatus`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    if (!resp.ok) return { ok: false };
    const text = await resp.text();
    const match = text.match(/<pwg:State>([^<]+)<\/pwg:State>/);
    return { ok: true, state: match?.[1] };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(t);
  }
}

export async function scanDocument(opts: ScanOptions): Promise<ScanResult> {
  const baseUrl = trimSlash(opts.baseUrl);
  const body = buildScanSettings(opts);

  const startResp = await fetch(`${baseUrl}/ScanJobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml' },
    body,
  });

  if (!startResp.ok) {
    const text = await startResp.text().catch(() => '');
    throw new Error(`Scanner refused job (HTTP ${startResp.status}): ${text.slice(0, 200)}`);
  }

  const location = startResp.headers.get('Location');
  if (!location) {
    throw new Error('Scanner did not return a job Location header');
  }

  const jobUrl = location.startsWith('http') ? location : new URL(location, baseUrl).toString();
  const nextDocUrl = `${trimSlash(jobUrl)}/NextDocument`;

  // Poll for the page (some scanners take a few seconds to expose the document)
  const maxAttempts = 60;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const docResp = await fetch(nextDocUrl);

    if (docResp.status === 503 || docResp.status === 404) {
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }

    if (!docResp.ok) {
      const text = await docResp.text().catch(() => '');
      throw new Error(`Scanner returned HTTP ${docResp.status}: ${text.slice(0, 200)}`);
    }

    const arrayBuf = await docResp.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    const contentType = docResp.headers.get('Content-Type') || (opts.format ?? 'image/jpeg');

    if (buffer.length === 0) {
      // Empty body — job not ready yet
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }

    return { buffer, contentType };
  }

  throw new Error('Scanner timed out — no document received');
}

export function bufferToDataUrl(buffer: Buffer, contentType: string): string {
  return `data:${contentType};base64,${buffer.toString('base64')}`;
}
