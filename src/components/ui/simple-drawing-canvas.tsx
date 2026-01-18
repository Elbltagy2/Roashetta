import React, { useRef, useState, useEffect, useCallback } from 'react';
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

export const SimpleDrawingCanvas: React.FC<SimpleDrawingCanvasProps> = ({
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
  const [isDrawing, setIsDrawing] = useState(false);
  const penColor = '#1a1a2e'; // Fixed dark color
  const [canvasHeight, setCanvasHeight] = useState(minHeight);
  const [isResizing, setIsResizing] = useState(false);

  // Keep pen size ref updated
  useEffect(() => {
    penSizeRef.current = externalPenSize;
  }, [externalPenSize]);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = penColor;

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load initial data if provided
    if (initialData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = initialData;
    }
  }, [initialData, penColor]);

  useEffect(() => {
    initCanvas();
  }, [canvasHeight]);

  useEffect(() => {
    // Initial setup
    const timer = setTimeout(initCanvas, 100);
    return () => clearTimeout(timer);
  }, [initCanvas]);

  const getCoordinates = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSizeRef.current;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    saveCanvas();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveCanvas();
  };

  const saveCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !onSave) return;
    onSave(canvas.toDataURL('image/png'));
  };

  const expandCanvas = () => {
    setCanvasHeight(prev => Math.min(prev + 100, maxHeight));
  };

  const shrinkCanvas = () => {
    setCanvasHeight(prev => Math.max(prev - 100, minHeight));
  };

  // Handle resize drag
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

      {/* Canvas Container */}
      <div className="relative bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
        {/* Placeholder text */}
        {placeholder && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <span className="text-gray-200 text-lg select-none">{placeholder}</span>
          </div>
        )}

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          style={{ height: `${canvasHeight}px`, width: '100%' }}
          className="touch-none cursor-crosshair relative z-10 bg-transparent"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Resize handle */}
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
};
