import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Pen, RotateCcw, Download, Printer, Eraser } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DoctorInfo {
  nameAr: string;
  nameEn: string;
  qualifications: string[];
  specialty: string;
  clinicName: string;
  clinicAddress: string;
  phone: string;
  hospital?: string;
  hospitalPhone?: string;
}

interface DrawingCanvasProps {
  onSave?: (dataUrl: string) => void;
  className?: string;
  height?: number;
  language?: 'ar' | 'en';
  doctorInfo?: DoctorInfo;
  patientName?: string;
}

const defaultDoctorInfo: DoctorInfo = {
  nameAr: 'شريف علي رضا',
  nameEn: 'Dr/ Sherif Ali . MD,MRCP (Uk)',
  qualifications: [
    'زميل الكلية الملكية البريطانية',
    'لطب الباطنة والكلى',
    'دكتوراه الأمراض الباطنية',
    'استشاري أمراض الباطنة العامة والكلى',
    'وعضو الجمعية المصرية والأوربية',
    'لأمراض الكلى',
    'بمستشفيات جامعة عين شمس',
  ],
  specialty: '',
  clinicName: '١٨ عمارات خلف العبور - مصر الجديدة',
  clinicAddress: '',
  phone: '٠١٥٥٤٣٤٣١٤٧ - ٠٢٢٢٦٠٢٧٣٣',
  hospital: 'مستشفى تبارك/النسائم',
  hospitalPhone: '١٦٥٥٢ - ١٥٤٥٢',
};

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  onSave,
  className,
  height = 400,
  language = 'ar',
  doctorInfo = defaultDoctorInfo,
  patientName = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#1a1a2e');
  const [penSize, setPenSize] = useState(2);
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Set initial styles
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

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
    ctx.strokeStyle = isEraser ? '#ffffff' : penColor;
    ctx.lineWidth = isEraser ? penSize * 4 : penSize;
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

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `prescription-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const printCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>طباعة الروشتة - Print Prescription</title>
          <style>
            @page { size: A5; margin: 10mm; }
            body {
              margin: 0;
              display: flex;
              justify-content: center;
              align-items: flex-start;
              padding: 20px;
            }
            img {
              max-width: 100%;
              height: auto;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
            }
          </style>
        </head>
        <body>
          <img src="${canvas.toDataURL('image/png')}" />
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); }
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Get current date in Arabic format
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;
  const year = today.getFullYear().toString().slice(-2);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Pen sizes */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {[1, 2, 4].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setPenSize(size)}
                className={cn(
                  'w-8 h-8 rounded-md flex items-center justify-center transition-colors',
                  penSize === size ? 'bg-primary text-primary-foreground' : 'hover:bg-muted-foreground/10'
                )}
              >
                <div
                  className="rounded-full bg-current"
                  style={{ width: size * 3, height: size * 3 }}
                />
              </button>
            ))}
          </div>

          {/* Colors */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {['#1a1a2e', '#1e40af', '#dc2626', '#16a34a'].map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => { setPenColor(color); setIsEraser(false); }}
                className={cn(
                  'w-8 h-8 rounded-md flex items-center justify-center transition-all',
                  penColor === color && !isEraser ? 'ring-2 ring-offset-2 ring-primary' : ''
                )}
              >
                <div
                  className="w-5 h-5 rounded-full"
                  style={{ backgroundColor: color }}
                />
              </button>
            ))}
          </div>

          {/* Eraser */}
          <button
            type="button"
            onClick={() => setIsEraser(!isEraser)}
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
              isEraser ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted-foreground/10'
            )}
            title={language === 'ar' ? 'ممحاة' : 'Eraser'}
          >
            <Eraser className="w-5 h-5" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearCanvas}
            className="gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            {language === 'ar' ? 'مسح' : 'Clear'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={downloadCanvas}
            className="gap-1.5"
          >
            <Download className="w-4 h-4" />
            {language === 'ar' ? 'تحميل' : 'Download'}
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={printCanvas}
            className="gap-1.5"
          >
            <Printer className="w-4 h-4" />
            {language === 'ar' ? 'طباعة' : 'Print'}
          </Button>
        </div>
      </div>

      {/* Egyptian Prescription Pad Design - Roashetta */}
      <div className="bg-white border border-gray-300 shadow-md" dir="rtl">
        {/* Header */}
        <div className="px-6 pt-5 pb-4">
          <div className="flex justify-between items-start">
            {/* Right Side - Arabic Doctor Info */}
            <div className="text-right">
              {/* Doctor title centered */}
              <p className="text-base font-bold text-gray-700 tracking-wide text-center">دكتـــور</p>
              {/* Doctor name with underline */}
              <p className="text-xl font-bold text-gray-900 mt-1 border-b border-gray-400 pb-1 inline-block">{doctorInfo.nameAr}</p>
              {/* Qualifications - constrained width */}
              <div className="mt-2 space-y-0" style={{ maxWidth: '140px' }}>
                {doctorInfo.qualifications.map((q, i) => (
                  <p key={i} className="text-[10px] text-gray-600 leading-tight">{q}</p>
                ))}
              </div>
            </div>

            {/* Left Side - English Name & Patient Info */}
            <div className="text-left" dir="ltr">
              <p className="text-sm font-semibold text-gray-700">{doctorInfo.nameEn}</p>

              {/* Patient Info */}
              <div className="space-y-2 mt-8" dir="rtl">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">الإســم:</span>
                  <div className="min-w-[120px] border-b border-gray-400 pb-0.5">
                    <span className="text-sm text-gray-800">{patientName || ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">التــاريخ:</span>
                  <div className="border-b border-gray-400 pb-0.5" dir="ltr">
                    <span className="text-sm text-gray-800">{day} / {month} / ٢٠</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area - Drawing Canvas */}
        <div className="relative bg-white min-h-[50px]">
          {/* Rx Symbol */}
          <div className="absolute top-4 right-6 select-none pointer-events-none z-0">
            <span className="text-5xl font-serif text-gray-300 italic" style={{ fontFamily: 'Times New Roman, serif' }}>
              R/
            </span>
          </div>

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            style={{ height: `${height}px`, width: '100%' }}
            className="touch-none cursor-crosshair relative z-10 bg-white"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />

          {/* Hint text */}
          <div className="absolute bottom-3 right-20 text-xs text-gray-300 pointer-events-none flex items-center gap-1">
            <Pen className="w-3 h-3" />
            {language === 'ar' ? 'اكتب الروشتة هنا' : 'Write prescription here'}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 px-6 py-3">
          <div className="flex justify-between items-start text-[10px] text-gray-600 max-w-full">
            {/* Right Side - Address & Phone */}
            <div className="text-right space-y-0.5">
              <p>{doctorInfo.clinicName}</p>
              <p>ت: {doctorInfo.phone}</p>
            </div>

            {/* Left Side - Hospital Info */}
            {doctorInfo.hospital && (
              <div className="text-right space-y-0.5">
                <p>{doctorInfo.hospital}</p>
                <p>{doctorInfo.hospitalPhone}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
