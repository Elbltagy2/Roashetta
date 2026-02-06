import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleDrawingCanvasProps {
  onSave?: (dataUrl: string) => void;
  initialData?: string | null;
  className?: string;
  minHeight?: number;
  maxHeight?: number;
  language?: 'ar' | 'en';
  placeholder?: string;
  showToolbar?: boolean;
  penSize?: number;
}

export const SimpleDrawingCanvas: React.FC<SimpleDrawingCanvasProps> = React.memo(({
  onSave,
  initialData,
  className,
  minHeight = 150,
  maxHeight = 600,
  language = 'ar',
  placeholder,
  showToolbar = true,
  penSize: externalPenSize = 2,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const penSizeRef = useRef(externalPenSize);
  const isDrawingRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  const initialDataRef = useRef(initialData);
  const hasLoadedDataRef = useRef(false);
  const hasUserDrawnRef = useRef(false);
  const onSaveRef = useRef(onSave);
  const lastXRef = useRef(0);
  const lastYRef = useRef(0);
  const penColor = '#1a1a2e';

  onSaveRef.current = onSave;
  const [canvasHeight, setCanvasHeight] = useState(minHeight);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    penSizeRef.current = externalPenSize;
  }, [externalPenSize]);

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || isInitializedRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSizeRef.current;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const dataToLoad = initialDataRef.current;
    if (dataToLoad) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        hasLoadedDataRef.current = true;
      };
      img.src = dataToLoad;
    }

    isInitializedRef.current = true;
  };

  useEffect(() => {
    const timer = setTimeout(setupCanvas, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!initialData || !isInitializedRef.current || hasLoadedDataRef.current) return;
    if (hasUserDrawnRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
      hasLoadedDataRef.current = true;
    };
    img.src = initialData;
  }, [initialData]);

  useEffect(() => {
    if (!isInitializedRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentImage = canvas.toDataURL('image/png');
    const oldWidth = canvas.width;
    const oldHeight = canvas.height;

    const rect = canvas.getBoundingClientRect();
    const newWidth = rect.width * window.devicePixelRatio;
    const newHeight = rect.height * window.devicePixelRatio;

    if (Math.abs(newWidth - oldWidth) < 1 && Math.abs(newHeight - oldHeight) < 1) {
      return;
    }

    canvas.width = newWidth;
    canvas.height = newHeight;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = penColor;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
    };
    img.src = currentImage;
  }, [canvasHeight]);

  // Use Pointer Events for better tablet/stylus support
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handlePointerDown = (e: PointerEvent) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      isDrawingRef.current = true;
      hasUserDrawnRef.current = true;

      const { x, y } = getPos(e);
      lastXRef.current = x;
      lastYRef.current = y;

      // Draw dot at start
      ctx.beginPath();
      ctx.fillStyle = penColor;
      ctx.arc(x, y, penSizeRef.current / 2, 0, Math.PI * 2);
      ctx.fill();
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { x, y } = getPos(e);

      ctx.beginPath();
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penSizeRef.current;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(lastXRef.current, lastYRef.current);
      ctx.lineTo(x, y);
      ctx.stroke();

      lastXRef.current = x;
      lastYRef.current = y;
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isDrawingRef.current) return;
      canvas.releasePointerCapture(e.pointerId);
      isDrawingRef.current = false;
      saveCanvas();
    };

    const handlePointerLeave = () => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      saveCanvas();
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerLeave);
    canvas.addEventListener('pointercancel', handlePointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      canvas.removeEventListener('pointercancel', handlePointerUp);
    };
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width * window.devicePixelRatio, rect.height * window.devicePixelRatio);

    if (onSaveRef.current) {
      onSaveRef.current(canvas.toDataURL('image/jpeg', 0.8));
    }
  };

  const saveCanvas = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas || !onSaveRef.current) return;
      onSaveRef.current(canvas.toDataURL('image/jpeg', 0.8));
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const expandCanvas = () => {
    setCanvasHeight(prev => Math.min(prev + 100, maxHeight));
  };

  const shrinkCanvas = () => {
    setCanvasHeight(prev => Math.max(prev - 100, minHeight));
  };

  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleResizeMove = (e: MouseEvent | TouchEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const newHeight = clientY - containerRect.top;

      setCanvasHeight(Math.max(minHeight, Math.min(maxHeight, newHeight)));
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      window.addEventListener('touchmove', handleResizeMove);
      window.addEventListener('touchend', handleResizeEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
      window.removeEventListener('touchmove', handleResizeMove);
      window.removeEventListener('touchend', handleResizeEnd);
    };
  }, [isResizing, minHeight, maxHeight]);

  return (
    <div className={cn('space-y-2', className)} ref={containerRef}>
      {showToolbar && (
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={shrinkCanvas}
            disabled={canvasHeight <= minHeight}
            className="h-8 w-8 p-0"
            title={language === 'ar' ? 'تصغير' : 'Shrink'}
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={expandCanvas}
            disabled={canvasHeight >= maxHeight}
            className="h-8 w-8 p-0"
            title={language === 'ar' ? 'تكبير' : 'Expand'}
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearCanvas}
            className="gap-1 h-8"
          >
            <RotateCcw className="w-3 h-3" />
            {language === 'ar' ? 'مسح' : 'Clear'}
          </Button>
        </div>
      )}

      <div className="relative bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
        {placeholder && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <span className="text-gray-200 text-lg select-none">{placeholder}</span>
          </div>
        )}

        {/* Erase button on canvas */}
        <button
          type="button"
          onClick={clearCanvas}
          className="absolute top-2 right-2 z-20 p-1.5 bg-white/80 hover:bg-white rounded-full shadow-sm border border-gray-200 transition-colors"
          title={language === 'ar' ? 'مسح' : 'Clear'}
        >
          <RotateCcw className="w-4 h-4 text-gray-600" />
        </button>

        <canvas
          ref={canvasRef}
          style={{ height: `${canvasHeight}px`, width: '100%', touchAction: 'none' }}
          className="cursor-crosshair relative z-10 bg-transparent"
        />

        <div
          className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-gray-100 to-transparent cursor-ns-resize flex items-center justify-center hover:from-gray-200 transition-colors"
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
      </div>
    </div>
  );
});
