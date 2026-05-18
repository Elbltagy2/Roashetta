import React, { useEffect, useState } from 'react';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';
import { pdfToImages } from '@/lib/pdf-to-images';
import { useLanguage } from '@/contexts/LanguageContext';

export interface ViewerFile {
  url: string;
  // 'image' or 'pdf' — the renderer mode. mimeType is the original MIME
  // for fallback decisions.
  type: 'image' | 'pdf';
  name: string;
  mimeType?: string;
}

interface FileViewerModalProps {
  files: ViewerFile[];
  initialIndex: number;
  /** Called when user closes the modal */
  onClose: () => void;
  /** Called when user navigates (for parent to track current index if needed) */
  onIndexChange?: (index: number) => void;
}

/**
 * Full-screen modal for previewing images and PDFs with built-in
 * Prev/Next slider navigation, keyboard support, and a file counter.
 *
 * Pass the full list of files in the same section and the index to
 * start at. The component handles its own internal index so the parent
 * only needs to render `<FileViewerModal/>` when there's something to
 * show and re-render with new files when the user opens from a different
 * list.
 */
export const FileViewerModal: React.FC<FileViewerModalProps> = ({
  files,
  initialIndex,
  onClose,
  onIndexChange,
}) => {
  const { language, direction } = useLanguage();
  const [index, setIndex] = useState(initialIndex);
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [pdfLoading, setPdfLoading] = useState(false);

  const current = files[index];

  // Reset index if files change (e.g. the parent passes a different list)
  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex, files]);

  // Load PDF pages when the current item is a PDF
  useEffect(() => {
    if (!current) return;
    if (current.type !== 'pdf') {
      setPdfPages([]);
      return;
    }
    let cancelled = false;
    setPdfLoading(true);
    setPdfPages([]);
    pdfToImages(current.url)
      .then((pages) => {
        if (!cancelled) setPdfPages(pages);
      })
      .catch((err) => {
        console.error('Failed to render PDF:', err);
      })
      .finally(() => {
        if (!cancelled) setPdfLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [current?.url, current?.type]);

  // Notify parent of index changes
  useEffect(() => {
    onIndexChange?.(index);
  }, [index, onIndexChange]);

  const goPrev = () => setIndex((i) => (i > 0 ? i - 1 : i));
  const goNext = () => setIndex((i) => (i < files.length - 1 ? i + 1 : i));

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') {
        direction === 'rtl' ? goNext() : goPrev();
      } else if (e.key === 'ArrowRight') {
        direction === 'rtl' ? goPrev() : goNext();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction, files.length, onClose]);

  if (!current) return null;

  const PrevIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;
  const NextIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-4 end-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-10"
        onClick={onClose}
        title={language === 'ar' ? 'إغلاق' : 'Close'}
      >
        <X className="w-6 h-6" />
      </button>

      {/* Top bar: counter + filename */}
      <div className="absolute top-4 start-4 z-10 flex items-center gap-3 text-white/90">
        <div className="px-3 py-1.5 rounded-full bg-white/10 text-sm font-medium">
          {index + 1} / {files.length}
        </div>
        <div className="px-3 py-1.5 rounded-full bg-white/10 text-sm truncate max-w-[50vw]">
          {current.name}
        </div>
      </div>

      {/* Prev / Next */}
      {files.length > 1 && (
        <>
          <button
            className="absolute start-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-10 disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            disabled={index === 0}
            title={language === 'ar' ? 'السابق' : 'Previous'}
          >
            <PrevIcon className="w-6 h-6" />
          </button>
          <button
            className="absolute end-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-10 disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            disabled={index === files.length - 1}
            title={language === 'ar' ? 'التالي' : 'Next'}
          >
            <NextIcon className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Body */}
      {current.type === 'image' ? (
        <img
          src={current.url}
          alt={current.name}
          className="max-w-[85vw] max-h-[85vh] object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          className="w-full max-w-4xl h-[85vh] rounded-lg bg-white overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {pdfLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">
                {language === 'ar' ? 'جاري التحميل...' : 'Loading PDF...'}
              </p>
            </div>
          ) : pdfPages.length > 0 ? (
            <div className="flex flex-col items-center gap-2 p-2">
              {pdfPages.map((pageImg, i) => (
                <img key={i} src={pageImg} alt={`Page ${i + 1}`} className="w-full" />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">
                {language === 'ar' ? 'تعذر تحميل الملف' : 'Failed to load PDF'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileViewerModal;
