import React, { useEffect, useRef, useState } from 'react';
import { Search, Plus, Trash2, ChevronUp, ChevronDown, Pill, Loader2 } from 'lucide-react';
import { api, DrugSearchResult, PrescriptionMedicine } from '@/services/api';

interface MedicineSelectFormProps {
  value: PrescriptionMedicine[];
  onChange: (meds: PrescriptionMedicine[]) => void;
  language: 'en' | 'ar';
}

// Tappable presets so the doctor rarely needs the keyboard (the tablet has no
// stylus and the keyboard is awkward). Each option carries an English label
// stored in the data, plus an Arabic label for display.
const FREQUENCY_PRESETS = [
  { value: '1x1', ar: 'مرة يومياً' },
  { value: '1x2', ar: 'مرتين يومياً' },
  { value: '1x3', ar: '٣ مرات يومياً' },
  { value: '1x4', ar: '٤ مرات يومياً' },
  { value: 'every 8h', ar: 'كل ٨ ساعات' },
  { value: 'every 12h', ar: 'كل ١٢ ساعة' },
  { value: 'PRN', ar: 'عند اللزوم' },
];

const DURATION_PRESETS = [
  { value: '3 days', ar: '٣ أيام' },
  { value: '5 days', ar: '٥ أيام' },
  { value: '7 days', ar: '٧ أيام' },
  { value: '10 days', ar: '١٠ أيام' },
  { value: '14 days', ar: '١٤ يوم' },
  { value: '1 month', ar: 'شهر' },
  { value: 'ongoing', ar: 'مستمر' },
];

const DOSE_PRESETS = [
  { value: '1 tab', ar: 'قرص' },
  { value: '2 tab', ar: 'قرصان' },
  { value: '½ tab', ar: 'نصف قرص' },
  { value: '1 cap', ar: 'كبسولة' },
  { value: '5 ml', ar: '٥ مل' },
  { value: '10 ml', ar: '١٠ مل' },
];

const TIMING_PRESETS = [
  { value: 'before meals', ar: 'قبل الأكل' },
  { value: 'after meals', ar: 'بعد الأكل' },
  { value: 'with meals', ar: 'مع الأكل' },
  { value: 'at bedtime', ar: 'قبل النوم' },
];

const MedicineSelectForm: React.FC<MedicineSelectFormProps> = ({ value, onChange, language }) => {
  const isAr = language === 'ar';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DrugSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced search against the backend drug database.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const drugs = await api.getDrugs(q, 30);
        setResults(drugs);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  // Close the results dropdown when clicking outside.
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const addDrug = (drug: DrugSearchResult) => {
    const name = (isAr && drug.commercialNameAr) ? drug.commercialNameAr : (drug.commercialNameEn || drug.commercialNameAr || '');
    const med: PrescriptionMedicine = {
      drugId: drug.id,
      name,
      nameAr: drug.commercialNameAr || undefined,
      scientific: drug.scientificName || undefined,
      dose: '',
      frequency: '',
      duration: '',
      instructions: '',
    };
    onChange([...value, med]);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const updateMed = (index: number, patch: Partial<PrescriptionMedicine>) => {
    onChange(value.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  };

  const removeMed = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const moveMed = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const ChipGroup = ({
    presets,
    selected,
    onPick,
    label,
  }: {
    presets: { value: string; ar: string }[];
    selected: string;
    onPick: (v: string) => void;
    label: string;
  }) => (
    <div className="space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => {
          const active = selected === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => onPick(active ? '' : p.value)}
              className={
                'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ' +
                (active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/50 text-foreground border-border hover:bg-muted')
              }
            >
              {isAr ? p.ar : p.value}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Search box */}
      <div className="relative" ref={boxRef}>
        <div className="relative">
          <Search className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results.length) setOpen(true); }}
            placeholder={isAr ? 'ابحث عن دواء بالاسم التجاري أو العلمي...' : 'Search medicine by trade or scientific name...'}
            className="w-full ltr:pl-9 rtl:pr-9 pr-3 py-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
          />
          {loading && (
            <Loader2 className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 w-4 h-4 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Results dropdown */}
        {open && results.length > 0 && (
          <div className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto bg-popover border border-border rounded-lg shadow-lg">
            {results.map((drug) => (
              <button
                key={drug.id}
                type="button"
                onClick={() => addDrug(drug)}
                className="w-full text-start px-3 py-2 hover:bg-muted flex items-start gap-2 border-b border-border/50 last:border-0"
              >
                <Plus className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {(isAr && drug.commercialNameAr) ? drug.commercialNameAr : drug.commercialNameEn}
                  </div>
                  {drug.scientificName && (
                    <div className="text-xs text-muted-foreground truncate">{drug.scientificName}</div>
                  )}
                  <div className="text-[11px] text-muted-foreground/80 truncate">
                    {[drug.manufacturer, drug.route, drug.priceEgp != null ? `${drug.priceEgp} EGP` : null]
                      .filter(Boolean)
                      .join(' • ')}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        {open && !loading && query.trim().length >= 2 && results.length === 0 && (
          <div className="absolute z-20 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-sm text-muted-foreground">
            {isAr ? 'لا توجد نتائج' : 'No results'}
          </div>
        )}
      </div>

      {/* Selected medicines */}
      {value.length === 0 ? (
        <div className="text-sm text-muted-foreground border border-dashed border-border rounded-lg py-6 text-center">
          {isAr ? 'لم يتم اختيار أدوية بعد. ابحث وأضف من القائمة بالأعلى.' : 'No medicines added yet. Search and tap to add.'}
        </div>
      ) : (
        <div className="space-y-3">
          {value.map((med, index) => (
            <div key={index} className="border border-border rounded-xl p-3 bg-card">
              {/* Header: number, name, controls */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-start gap-2 min-w-0">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{med.name}</span>
                    </div>
                    {med.scientific && (
                      <div className="text-xs text-muted-foreground truncate">{med.scientific}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button type="button" onClick={() => moveMed(index, -1)} disabled={index === 0}
                    className="p-1 rounded hover:bg-muted disabled:opacity-30" title="Up">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => moveMed(index, 1)} disabled={index === value.length - 1}
                    className="p-1 rounded hover:bg-muted disabled:opacity-30" title="Down">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => removeMed(index)}
                    className="p-1 rounded hover:bg-destructive/10 text-destructive" title="Remove">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chip groups */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ChipGroup
                  label={isAr ? 'الجرعة' : 'Dose'}
                  presets={DOSE_PRESETS}
                  selected={med.dose}
                  onPick={(v) => updateMed(index, { dose: v })}
                />
                <ChipGroup
                  label={isAr ? 'التكرار' : 'Frequency'}
                  presets={FREQUENCY_PRESETS}
                  selected={med.frequency}
                  onPick={(v) => updateMed(index, { frequency: v })}
                />
                <ChipGroup
                  label={isAr ? 'المدة' : 'Duration'}
                  presets={DURATION_PRESETS}
                  selected={med.duration}
                  onPick={(v) => updateMed(index, { duration: v })}
                />
                <ChipGroup
                  label={isAr ? 'التعليمات' : 'Instructions'}
                  presets={TIMING_PRESETS}
                  selected={med.instructions}
                  onPick={(v) => updateMed(index, { instructions: v })}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicineSelectForm;
