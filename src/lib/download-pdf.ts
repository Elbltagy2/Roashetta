import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export async function downloadPdf(htmlContent: string, filename: string, pageSize: 'a4' | 'a5' = 'a5') {
  // Open new tab IMMEDIATELY (must be in click context, otherwise tablet Chrome blocks it)
  const pdfTab = window.open('', '_blank');
  if (pdfTab) {
    pdfTab.document.write('<html><head><title>' + filename + '</title></head><body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:sans-serif;background:#f5f5f5;"><div style="text-align:center;"><p style="font-size:18px;">Generating PDF...</p></div></body></html>');
  }

  // Parse the full HTML document
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Build a hidden iframe for html2canvas to render from
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  iframe.style.width = pageSize === 'a4' ? '210mm' : '148mm';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error('Could not access iframe document');
  }

  // Write full HTML into the iframe
  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  // Wait for images inside the iframe to load
  await new Promise<void>(resolve => {
    const checkReady = () => {
      const imgs = iframeDoc.querySelectorAll('img');
      const allLoaded = Array.from(imgs).every(img => img.complete && img.naturalWidth > 0);
      if (allLoaded || imgs.length === 0) {
        resolve();
      } else {
        setTimeout(checkReady, 100);
      }
    };
    setTimeout(checkReady, 300);
  });

  // Give extra time for fonts and layout
  await new Promise(resolve => setTimeout(resolve, 300));

  // Make iframe visible for html2canvas to capture
  iframe.style.left = '0';
  iframe.style.visibility = 'visible';
  iframe.style.height = 'auto';

  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  try {
    const body = iframeDoc.body;

    const canvas = await html2canvas(body, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: body.scrollWidth,
      height: body.scrollHeight,
      windowWidth: body.scrollWidth,
      windowHeight: body.scrollHeight,
    });

    // Page dimensions in mm
    const pageMM = pageSize === 'a4'
      ? { w: 210, h: 297 }
      : { w: 148, h: 210 };

    const pdf = new jsPDF({ unit: 'mm', format: pageSize, orientation: 'portrait' });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const imgWidthPx = canvas.width;
    const imgHeightPx = canvas.height;

    const ratio = pageMM.w / imgWidthPx;
    const totalHeightMM = imgHeightPx * ratio;
    const pageHeightMM = pageMM.h;

    let yOffset = 0;
    let page = 0;
    while (yOffset < totalHeightMM) {
      if (page > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, -yOffset, pageMM.w, totalHeightMM);
      yOffset += pageHeightMM;
      page++;
    }

    // Show PDF in the already-open tab
    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);

    if (pdfTab && !pdfTab.closed) {
      pdfTab.location.href = url;
    } else {
      // Fallback if tab was closed or blocked
      window.open(url, '_blank');
    }
  } finally {
    document.body.style.overflow = prevOverflow;
    document.body.removeChild(iframe);
  }
}

export function printHtml(html: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const htmlWithPrint = html.replace(
    '</body>',
    `<script>
      window.onload = function() {
        setTimeout(function() {
          window.print();
          window.onafterprint = function() { window.close(); };
        }, 500);
      };
    </script></body>`
  );

  printWindow.document.write(htmlWithPrint);
  printWindow.document.close();
}
