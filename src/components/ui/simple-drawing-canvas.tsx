import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, ChevronDown, ChevronUp, PenTool, Type, Eraser } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  isTextModeData,
  parseTextModeData,
  encodeTextModeData,
  renderTextToDataUrl,
} from '@/lib/drawing-utils';

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
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const penSizeRef = useRef(externalPenSize);
  const isDrawingRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  const initialDataRef = useRef(initialData);
  const savedDrawingRef = useRef<string | null>(null);
  const hasLoadedDataRef = useRef(false);
  const hasUserDrawnRef = useRef(false);
  const onSaveRef = useRef(onSave);
  const lastXRef = useRef(0);
  const lastYRef = useRef(0);
  const penColor = '#1a1a2e';

  onSaveRef.current = onSave;

  // Detect initial mode from initialData
  const initialParsed = initialData ? parseTextModeData(initialData) : null;
  const [mode, setMode] = useState<'draw' | 'text'>(initialParsed ? 'text' : 'draw');
  const [textContent, setTextContent] = useState(initialParsed?.text || '');
  const [canvasHeight, setCanvasHeight] = useState(minHeight);
  const [isResizing, setIsResizing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const toolRef = useRef<'pen' | 'eraser'>('pen');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    penSizeRef.current = externalPenSize;
  }, [externalPenSize]);

  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);

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

    // Load saved drawing first (from mode switch), then fall back to initialData
    const dataToLoad = savedDrawingRef.current || initialDataRef.current;
    if (dataToLoad && !isTextModeData(dataToLoad)) {
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
    if (mode === 'draw') {
      const timer = setTimeout(setupCanvas, 100);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  useEffect(() => {
    if (!initialData || !isInitializedRef.current || hasLoadedDataRef.current) return;
    if (hasUserDrawnRef.current) return;
    if (isTextModeData(initialData)) return;

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

  // Sync internal mode/textContent when initialData becomes non-empty after
  // mount (e.g. a draft restore or edit-mode hydration). Without this, the
  // canvas mounts with initialData='' and never picks up the prop change,
  // so the user sees an empty canvas even though their data was restored
  // into the parent state. Fires once per mount; user actions afterward
  // produce self-induced prop changes which we intentionally ignore.
  const initialSyncDoneRef = useRef(false);
  useEffect(() => {
    if (initialSyncDoneRef.current) return;
    if (!initialData) return;
    if (hasUserDrawnRef.current) return;

    initialSyncDoneRef.current = true;
    initialDataRef.current = initialData;

    const parsed = parseTextModeData(initialData);
    if (parsed) {
      setMode('text');
      setTextContent(parsed.text);
    } else {
      // Draw-mode data — let the canvas re-init so setupCanvas picks
      // up the new initialDataRef on its next pass.
      hasLoadedDataRef.current = false;
    }
  }, [initialData]);

  useEffect(() => {
    if (!isInitializedRef.current || mode !== 'draw') return;

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
  }, [canvasHeight, mode]);

  // Use Pointer Events for better tablet/stylus support
  useEffect(() => {
    if (mode !== 'draw') return;

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

      const isErasing = toolRef.current === 'eraser';
      const color = isErasing ? '#ffffff' : penColor;
      const size = isErasing ? penSizeRef.current * 4 : penSizeRef.current;

      // Draw dot at start
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { x, y } = getPos(e);

      const isErasing = toolRef.current === 'eraser';
      const color = isErasing ? '#ffffff' : penColor;
      const size = isErasing ? penSizeRef.current * 4 : penSizeRef.current;

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
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
  }, [mode]);

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

  const clearText = () => {
    setTextContent('');
    if (onSaveRef.current) {
      onSaveRef.current('');
    }
  };

  const handleClear = () => {
    if (mode === 'draw') {
      clearCanvas();
    } else {
      clearText();
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

  const saveText = useCallback((text: string) => {
    if (textSaveTimeoutRef.current) {
      clearTimeout(textSaveTimeoutRef.current);
    }
    textSaveTimeoutRef.current = setTimeout(() => {
      if (!onSaveRef.current) return;
      if (!text.trim()) {
        onSaveRef.current('');
        return;
      }
      // Get wrapper dimensions for rendering
      const wrapper = canvasWrapperRef.current;
      const w = wrapper ? wrapper.clientWidth : 600;
      const h = canvasHeight;

      const dataUrl = renderTextToDataUrl(text, {
        width: w,
        height: h,
        fontSize: 16,
        direction: language === 'ar' ? 'rtl' : 'ltr',
        padding: 16,
      });
      onSaveRef.current(encodeTextModeData(text, dataUrl));
    }, 300);
  }, [canvasHeight, language]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setTextContent(text);
    saveText(text);
  };

  const handleModeSwitch = (newMode: 'draw' | 'text') => {
    if (newMode === mode) return;

    if (mode === 'draw' && newMode === 'text') {
      // Save current canvas drawing into ref before switching
      const canvas = canvasRef.current;
      if (canvas) {
        savedDrawingRef.current = canvas.toDataURL('image/jpeg', 0.8);
      }
      isInitializedRef.current = false;

      // Save the text content to parent (or empty if no text yet)
      if (onSaveRef.current) {
        if (textContent.trim()) {
          const wrapper = canvasWrapperRef.current;
          const w = wrapper ? wrapper.clientWidth : 600;
          const dataUrl = renderTextToDataUrl(textContent, {
            width: w,
            height: canvasHeight,
            fontSize: 16,
            direction: language === 'ar' ? 'rtl' : 'ltr',
            padding: 16,
          });
          onSaveRef.current(encodeTextModeData(textContent, dataUrl));
        }
      }
    }

    if (mode === 'text' && newMode === 'draw') {
      // Reset canvas initialization so it loads savedDrawingRef
      isInitializedRef.current = false;
      hasLoadedDataRef.current = false;

      // Save the drawing to parent
      if (onSaveRef.current && savedDrawingRef.current) {
        onSaveRef.current(savedDrawingRef.current);
      }
    }

    setMode(newMode);
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (textSaveTimeoutRef.current) {
        clearTimeout(textSaveTimeoutRef.current);
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

  // Focus textarea when switching to text mode
  useEffect(() => {
    if (mode === 'text' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [mode]);

  return (
    <div className={cn('space-y-2', className)} ref={containerRef}>
      {showToolbar && (
        <div className="flex items-center justify-between gap-1">
          {/* Mode toggle - LEFT side */}
          <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => handleModeSwitch('draw')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                mode === 'draw'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'hover:bg-muted-foreground/10 text-muted-foreground'
              )}
            >
              <PenTool className="w-4 h-4" />
              {language === 'ar' ? 'رسم' : 'Draw'}
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch('text')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                mode === 'text'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'hover:bg-muted-foreground/10 text-muted-foreground'
              )}
            >
              <Type className="w-4 h-4" />
              {language === 'ar' ? 'نص' : 'Text'}
            </button>
          </div>

          {/* Existing toolbar buttons - RIGHT side */}
          <div className="flex items-center gap-1">
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
              onClick={handleClear}
              className="gap-1 h-8"
            >
              <RotateCcw className="w-3 h-3" />
              {language === 'ar' ? 'مسح' : 'Clear'}
            </Button>
          </div>
        </div>
      )}

      <div ref={canvasWrapperRef} className="relative bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
        {mode === 'draw' && (
          <>
            {placeholder && !textContent && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <span className="text-gray-200 text-lg select-none">{placeholder}</span>
              </div>
            )}

            {/* Pen / Eraser / Clear buttons on canvas */}
            <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTool('pen')}
                className={cn(
                  'p-1.5 rounded-full shadow-sm border transition-colors',
                  tool === 'pen'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-white/80 hover:bg-white border-gray-200 text-gray-600'
                )}
                title={language === 'ar' ? 'قلم' : 'Pen'}
              >
                <PenTool className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setTool('eraser')}
                className={cn(
                  'p-1.5 rounded-full shadow-sm border transition-colors',
                  tool === 'eraser'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-white/80 hover:bg-white border-gray-200 text-gray-600'
                )}
                title={language === 'ar' ? 'ممحاة' : 'Eraser'}
              >
                <Eraser className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={clearCanvas}
                className="p-1.5 bg-white/80 hover:bg-white rounded-full shadow-sm border border-gray-200 transition-colors"
                title={language === 'ar' ? 'مسح الكل' : 'Clear all'}
              >
                <RotateCcw className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <canvas
              ref={canvasRef}
              style={{ height: `${canvasHeight}px`, width: '100%', touchAction: 'none' }}
              className={cn('relative z-10 bg-transparent', tool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair')}
            />
          </>
        )}

        {mode === 'text' && (
          <>
            {/* Clear button on textarea */}
            <button
              type="button"
              onClick={clearText}
              className="absolute top-2 right-2 z-20 p-1.5 bg-white/80 hover:bg-white rounded-full shadow-sm border border-gray-200 transition-colors"
              title={language === 'ar' ? 'مسح' : 'Clear'}
            >
              <RotateCcw className="w-4 h-4 text-gray-600" />
            </button>

            <textarea
              ref={textareaRef}
              value={textContent}
              onChange={handleTextChange}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
              style={{
                height: `${canvasHeight}px`,
                fontFamily: "'Cairo', 'Segoe UI', sans-serif",
                fontSize: '16px',
              }}
              className="w-full resize-none p-4 outline-none bg-transparent relative z-10 text-gray-800 leading-relaxed"
              placeholder={placeholder}
            />
          </>
        )}

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
