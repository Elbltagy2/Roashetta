import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// Accepts either a base64 data URL ("data:application/pdf;base64,...")
// or a relative file path served by the backend ("/files/attachments/abc.pdf").
export async function pdfToImages(dataUrlOrPath: string): Promise<string[]> {
  let source: { data: Uint8Array } | { url: string };

  if (dataUrlOrPath.startsWith('data:')) {
    const base64 = dataUrlOrPath.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    source = { data: bytes };
  } else {
    // File path — let pdfjs fetch it directly
    const url = dataUrlOrPath.startsWith('http') ? dataUrlOrPath : dataUrlOrPath;
    source = { url };
  }

  const pdf = await pdfjsLib.getDocument(source).promise;
  const images: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const scale = 2;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: canvas.getContext('2d')!,
      viewport,
    }).promise;

    images.push(canvas.toDataURL('image/png'));
  }

  return images;
}
