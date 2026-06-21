import React, { useState } from 'react';
import { Delete, X, ArrowBigUp, CornerDownLeft } from 'lucide-react';

interface OnScreenKeyboardProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  language: 'en' | 'ar';
  title?: string;
}

// Tap-only keyboard for tablets where the native on-screen keyboard does not
// auto-open. Appends/deletes at the end of the value (no caret tracking —
// adequate for free-text "Others" notes). Supports English + Arabic layouts.
const EN_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.'],
];

const AR_ROWS = [
  ['١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '٠'],
  ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج'],
  ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'],
  ['ئ', 'ء', 'ؤ', 'ر', 'ى', 'ة', 'و', 'ز', 'ظ', 'د', 'ذ'],
];

const OnScreenKeyboard: React.FC<OnScreenKeyboardProps> = ({ value, onChange, onClose, language, title }) => {
  const [layout, setLayout] = useState<'en' | 'ar'>(language === 'ar' ? 'ar' : 'en');
  const [caps, setCaps] = useState(false);

  const rows = layout === 'ar' ? AR_ROWS : EN_ROWS;
  const isAr = language === 'ar';

  const press = (key: string) => {
    const ch = layout === 'en' && caps ? key.toUpperCase() : key;
    onChange(value + ch);
  };
  const backspace = () => onChange(value.slice(0, -1));
  const space = () => onChange(value + ' ');
  const newline = () => onChange(value + '\n');
  const clearAll = () => onChange('');

  const keyCls =
    'flex-1 min-w-[28px] h-11 rounded-md bg-background border border-border text-sm font-medium ' +
    'active:bg-primary active:text-primary-foreground hover:bg-muted transition-colors select-none';

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-card border-t border-border shadow-2xl" dir="ltr">
      <div className="max-w-3xl mx-auto p-2 sm:p-3">
        {/* Header: title, preview, close */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-medium text-muted-foreground truncate">
            {title || (isAr ? 'لوحة المفاتيح' : 'Keyboard')}
          </span>
          <button type="button" onClick={onClose} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div
          className="mb-2 px-2 py-1.5 rounded-md bg-muted/50 border border-border text-sm min-h-[34px] whitespace-pre-wrap break-words"
          dir={layout === 'ar' ? 'rtl' : 'ltr'}
        >
          {value || <span className="text-muted-foreground">…</span>}
        </div>

        {/* Key rows */}
        <div className="space-y-1.5" dir="ltr">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-1.5 justify-center">
              {i === rows.length - 1 && layout === 'en' && (
                <button
                  type="button"
                  onClick={() => setCaps((c) => !c)}
                  className={keyCls + (caps ? ' !bg-primary !text-primary-foreground' : '')}
                  style={{ flex: '1.4' }}
                >
                  <ArrowBigUp className="w-4 h-4 mx-auto" />
                </button>
              )}
              {row.map((k) => (
                <button key={k} type="button" onClick={() => press(k)} className={keyCls}>
                  {layout === 'en' && caps ? k.toUpperCase() : k}
                </button>
              ))}
              {i === rows.length - 1 && (
                <button type="button" onClick={backspace} className={keyCls} style={{ flex: '1.4' }}>
                  <Delete className="w-4 h-4 mx-auto" />
                </button>
              )}
            </div>
          ))}

          {/* Bottom control row */}
          <div className="flex gap-1.5 justify-center">
            <button
              type="button"
              onClick={() => setLayout((l) => (l === 'en' ? 'ar' : 'en'))}
              className={keyCls}
              style={{ flex: '1.6' }}
            >
              {layout === 'en' ? 'ع' : 'ABC'}
            </button>
            <button type="button" onClick={space} className={keyCls} style={{ flex: '4' }}>
              {isAr ? 'مسافة' : 'space'}
            </button>
            <button type="button" onClick={newline} className={keyCls} style={{ flex: '1.4' }}>
              <CornerDownLeft className="w-4 h-4 mx-auto" />
            </button>
            <button
              type="button"
              onClick={clearAll}
              className={keyCls + ' text-destructive'}
              style={{ flex: '1.6' }}
            >
              {isAr ? 'مسح' : 'clear'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-w-[28px] h-11 rounded-md bg-primary text-primary-foreground text-sm font-semibold"
              style={{ flex: '1.8' }}
            >
              {isAr ? 'تم' : 'Done'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnScreenKeyboard;
