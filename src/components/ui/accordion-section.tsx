import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccordionItem {
  id: string;
  title: string;
  titleAr?: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

interface AccordionSectionProps {
  items: AccordionItem[];
  activeId: string | null;
  onToggle: (id: string) => void;
  language?: string;
  className?: string;
}

export const AccordionSection: React.FC<AccordionSectionProps> = ({
  items,
  activeId,
  onToggle,
  language = 'en',
  className,
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {items.map((item) => {
        const isOpen = activeId === item.id;
        const title = language === 'ar' && item.titleAr ? item.titleAr : item.title;

        return (
          <div
            key={item.id}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            <button
              type="button"
              onClick={() => onToggle(item.id)}
              className={cn(
                'w-full flex items-center justify-between p-4 text-start transition-colors',
                'hover:bg-muted/50',
                isOpen && 'bg-muted/30'
              )}
            >
              <div className="flex items-center gap-3">
                {item.icon && (
                  <span className="text-primary">{item.icon}</span>
                )}
                <span className="font-medium text-foreground">{title}</span>
              </div>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 border-t border-border">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

export default AccordionSection;
