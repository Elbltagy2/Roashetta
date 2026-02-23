// Utility functions for text-mode data encoding/decoding in drawing fields

const TEXT_MODE_PREFIX = 'ROASHETTA_TEXT_V1:';

export interface TextModeData {
  text: string;
  dataUrl: string;
}

/** Check if a stored value is text-mode data */
export function isTextModeData(data: string | null | undefined): boolean {
  return !!data && data.startsWith(TEXT_MODE_PREFIX);
}

/** Parse text-mode data, returns null if not text-mode */
export function parseTextModeData(data: string | null | undefined): TextModeData | null {
  if (!data || !data.startsWith(TEXT_MODE_PREFIX)) return null;
  try {
    const json = data.slice(TEXT_MODE_PREFIX.length);
    const parsed = JSON.parse(json);
    return {
      text: parsed.text || '',
      dataUrl: parsed.dataUrl || '',
    };
  } catch {
    return null;
  }
}

/** Extract the displayable data URL from either format */
export function getDisplayDataUrl(data: string | null | undefined): string | null {
  if (!data) return null;
  const parsed = parseTextModeData(data);
  if (parsed) return parsed.dataUrl || null;
  return data;
}

/** Encode text-mode data into the storable string format */
export function encodeTextModeData(text: string, dataUrl: string): string {
  return TEXT_MODE_PREFIX + JSON.stringify({ text, dataUrl });
}

/** Render text onto an offscreen canvas and return a JPEG data URL */
export function renderTextToDataUrl(
  text: string,
  options: {
    width: number;
    height: number;
    fontSize?: number;
    direction?: 'rtl' | 'ltr';
    padding?: number;
  }
): string {
  const {
    width,
    height,
    fontSize = 16,
    direction = 'rtl',
    padding = 16,
  } = options;

  const canvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.scale(dpr, dpr);

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Text settings
  ctx.fillStyle = '#1a1a2e';
  ctx.font = `${fontSize}px 'Cairo', 'Segoe UI', sans-serif`;
  ctx.textBaseline = 'top';
  ctx.direction = direction;
  ctx.textAlign = direction === 'rtl' ? 'right' : 'left';

  const lineHeight = fontSize * 1.6;
  const maxWidth = width - padding * 2;
  const startX = direction === 'rtl' ? width - padding : padding;
  let y = padding;

  // Split into lines and wrap
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.trim() === '') {
      y += lineHeight;
      if (y > height - padding) break;
      continue;
    }

    const words = line.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? currentLine + ' ' + word : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        ctx.fillText(currentLine, startX, y);
        y += lineHeight;
        if (y > height - padding) break;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine && y <= height - padding) {
      ctx.fillText(currentLine, startX, y);
      y += lineHeight;
    }

    if (y > height - padding) break;
  }

  return canvas.toDataURL('image/jpeg', 0.8);
}
