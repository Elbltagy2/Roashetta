import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export async function downloadPdf(htmlContent: string, filename: string, pageSize: 'a4' | 'a5' = 'a5') {
  // Parse the full HTML document properly
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Create off-screen container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '0';
  container.style.top = '0';
  container.style.opacity = '0';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '-9999';

  // Copy <style> tags, rewriting 'body' selectors to target our wrapper class
  doc.querySelectorAll('style').forEach(styleEl => {
    const rewritten = (styleEl.textContent || '').replace(/\bbody\b/g, '.pdf-body');
    const newStyle = document.createElement('style');
    newStyle.textContent = rewritten;
    container.appendChild(newStyle);
  });

  // Create wrapper div that receives body styles via .pdf-body class
  const wrapper = document.createElement('div');
  wrapper.className = 'pdf-body';
  wrapper.style.width = pageSize === 'a4' ? '210mm' : '148mm';
  wrapper.style.background = 'white';
  wrapper.innerHTML = doc.body.innerHTML;
  if (doc.body.getAttribute('dir')) {
    wrapper.setAttribute('dir', doc.body.getAttribute('dir')!);
  }
  container.appendChild(wrapper);

  document.body.appendChild(container);

  // Wait for images to load
  const images = container.querySelectorAll('img');
  if (images.length > 0) {
    await Promise.all(
      Array.from(images).map(img =>
        img.complete && img.naturalWidth > 0
          ? Promise.resolve()
          : new Promise<void>(resolve => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            })
      )
    );
  }

  // Let the browser finish layout
  await new Promise(resolve => setTimeout(resolve, 200));

  try {
    // Capture the wrapper as a canvas
    const canvas = await html2canvas(wrapper, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    // Page dimensions in mm
    const pageMM = pageSize === 'a4'
      ? { w: 210, h: 297 }
      : { w: 148, h: 210 };

    const pdf = new jsPDF({ unit: 'mm', format: pageSize, orientation: 'portrait' });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const imgWidthPx = canvas.width;
    const imgHeightPx = canvas.height;

    // Scale image to fit page width
    const ratio = pageMM.w / imgWidthPx;
    const totalHeightMM = imgHeightPx * ratio;
    const pageHeightMM = pageMM.h;

    // Render page by page
    let yOffset = 0;
    let page = 0;
    while (yOffset < totalHeightMM) {
      if (page > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, -yOffset, pageMM.w, totalHeightMM);
      yOffset += pageHeightMM;
      page++;
    }

    // Download via blob + link (more reliable than .save())
    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.pdf`;
    link.click();

    // Also open in new tab
    window.open(url, '_blank');
  } finally {
    document.body.removeChild(container);
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
