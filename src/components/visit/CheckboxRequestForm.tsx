import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Keyboard } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import OnScreenKeyboard from '@/components/ui/on-screen-keyboard';

export interface ChecklistCategory {
  id: string;
  name: string;
  nameAr: string;
  tests: { id: string; name: string }[];
}

type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'teal' | 'rose' | 'indigo' | 'amber' | 'cyan';

const colorMap: Record<AccentColor, { bg: string; hover: string; chevron: string; text: string; badge: string; ring: string; check: string; hoverLabel: string }> = {
  blue:   { bg: 'bg-blue-50',   hover: 'hover:bg-blue-100',   chevron: 'text-blue-600',   text: 'text-blue-700',   badge: 'bg-blue-600',   ring: 'focus:ring-blue-500',   check: 'text-blue-600',   hoverLabel: 'hover:bg-blue-50' },
  purple: { bg: 'bg-purple-50', hover: 'hover:bg-purple-100', chevron: 'text-purple-600', text: 'text-purple-700', badge: 'bg-purple-600', ring: 'focus:ring-purple-500', check: 'text-purple-600', hoverLabel: 'hover:bg-purple-50' },
  green:  { bg: 'bg-green-50',  hover: 'hover:bg-green-100',  chevron: 'text-green-600',  text: 'text-green-700',  badge: 'bg-green-600',  ring: 'focus:ring-green-500',  check: 'text-green-600',  hoverLabel: 'hover:bg-green-50' },
  orange: { bg: 'bg-orange-50', hover: 'hover:bg-orange-100', chevron: 'text-orange-600', text: 'text-orange-700', badge: 'bg-orange-600', ring: 'focus:ring-orange-500', check: 'text-orange-600', hoverLabel: 'hover:bg-orange-50' },
  teal:   { bg: 'bg-teal-50',   hover: 'hover:bg-teal-100',   chevron: 'text-teal-600',   text: 'text-teal-700',   badge: 'bg-teal-600',   ring: 'focus:ring-teal-500',   check: 'text-teal-600',   hoverLabel: 'hover:bg-teal-50' },
  rose:   { bg: 'bg-rose-50',   hover: 'hover:bg-rose-100',   chevron: 'text-rose-600',   text: 'text-rose-700',   badge: 'bg-rose-600',   ring: 'focus:ring-rose-500',   check: 'text-rose-600',   hoverLabel: 'hover:bg-rose-50' },
  indigo: { bg: 'bg-indigo-50', hover: 'hover:bg-indigo-100', chevron: 'text-indigo-600', text: 'text-indigo-700', badge: 'bg-indigo-600', ring: 'focus:ring-indigo-500', check: 'text-indigo-600', hoverLabel: 'hover:bg-indigo-50' },
  amber:  { bg: 'bg-amber-50',  hover: 'hover:bg-amber-100',  chevron: 'text-amber-600',  text: 'text-amber-700',  badge: 'bg-amber-600',  ring: 'focus:ring-amber-500',  check: 'text-amber-600',  hoverLabel: 'hover:bg-amber-50' },
  cyan:   { bg: 'bg-cyan-50',   hover: 'hover:bg-cyan-100',   chevron: 'text-cyan-600',   text: 'text-cyan-700',   badge: 'bg-cyan-600',   ring: 'focus:ring-cyan-500',   check: 'text-cyan-600',   hoverLabel: 'hover:bg-cyan-50' },
};

interface CheckboxRequestFormProps {
  categories: ChecklistCategory[];
  selectedItems: Record<string, boolean>;
  onItemToggle: (itemId: string) => void;
  otherText: string;
  onOtherTextChange: (value: string) => void;
  accentColor?: AccentColor;
  otherPlaceholder?: string;
}

const CheckboxRequestForm: React.FC<CheckboxRequestFormProps> = ({
  categories,
  selectedItems,
  onItemToggle,
  otherText,
  onOtherTextChange,
  accentColor = 'blue',
  otherPlaceholder = 'Enter other items...',
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const didInitialExpand = useRef(false);
  const c = colorMap[accentColor];
  const { language } = useLanguage();
  // In-app keyboard for the free-text "Others" field — tablets where the
  // native keyboard does not auto-open can still type via taps.
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // First time we see non-empty data (e.g. from a draft restore or edit-mode
  // load), auto-expand any category that already has selections so the
  // doctor doesn't have to manually open each dropdown to find their work.
  useEffect(() => {
    if (didInitialExpand.current) return;
    const hasAnyChecked = Object.values(selectedItems).some((v) => v);
    const hasOtherText = !!otherText && otherText.trim().length > 0;
    if (!hasAnyChecked && !hasOtherText) return;

    didInitialExpand.current = true;
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      categories.forEach((cat) => {
        const anyChecked = cat.tests.some((t) => selectedItems[t.id]);
        const isOthersWithText = cat.id === 'others' && hasOtherText;
        if (anyChecked || isOthersWithText) next.add(cat.id);
      });
      return next;
    });
  }, [selectedItems, otherText, categories]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const getSelectedCount = (category: ChecklistCategory) => {
    return category.tests.filter(test => selectedItems[test.id]).length;
  };

  const third = Math.ceil(categories.length / 3);
  const column1 = categories.slice(0, third);
  const column2 = categories.slice(third, third * 2);
  const column3 = categories.slice(third * 2);

  const renderCategory = (category: ChecklistCategory) => {
    const isExpanded = expandedCategories.has(category.id);
    const selectedCount = getSelectedCount(category);
    const isOthers = category.id === 'others';

    return (
      <div key={category.id} className="mb-2 border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggleCategory(category.id)}
          className={`w-full flex items-center justify-between px-3 py-2 ${c.bg} ${c.hover} transition-colors`}
        >
          <div className="flex items-center gap-2">
            <ChevronDown
              className={`w-4 h-4 ${c.chevron} transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
            <span className={`text-sm font-semibold ${c.text}`}>{category.name}</span>
            {selectedCount > 0 && (
              <span className={`${c.badge} text-white text-xs px-1.5 py-0.5 rounded-full`}>
                {selectedCount}
              </span>
            )}
            {isOthers && otherText && (
              <span className={`${c.badge} text-white text-xs px-1.5 py-0.5 rounded-full`}>
                1
              </span>
            )}
          </div>
          <span className="text-gray-500 text-xs">{category.nameAr}</span>
        </button>

        {isExpanded && (
          <div className="p-2 bg-white">
            {isOthers ? (
              <div
                role="textbox"
                tabIndex={0}
                onClick={() => setKeyboardOpen(true)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm cursor-pointer whitespace-pre-wrap break-words min-h-[72px] focus:outline-none focus:ring-2 ${c.ring}`}
              >
                {otherText
                  ? otherText
                  : (
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Keyboard className="w-4 h-4" />
                      {otherPlaceholder} {language === 'ar' ? '(اضغط للكتابة)' : '(tap to type)'}
                    </span>
                  )}
              </div>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {category.tests.map((test) => (
                  <label
                    key={test.id}
                    className={`flex items-center space-x-2 cursor-pointer ${c.hoverLabel} rounded px-2 py-1`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems[test.id] || false}
                      onChange={() => onItemToggle(test.id)}
                      className={`w-4 h-4 ${c.check} border-gray-300 rounded ${c.ring}`}
                    />
                    <span className="text-sm text-gray-700">{test.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-1">{column1.map(renderCategory)}</div>
        <div className="space-y-1">{column2.map(renderCategory)}</div>
        <div className="space-y-1">{column3.map(renderCategory)}</div>
      </div>
      {keyboardOpen && (
        <OnScreenKeyboard
          value={otherText}
          onChange={onOtherTextChange}
          onClose={() => setKeyboardOpen(false)}
          language={language}
          title={language === 'ar' ? 'إدخال نص آخر' : 'Other — text entry'}
        />
      )}
    </div>
  );
};

export default CheckboxRequestForm;
