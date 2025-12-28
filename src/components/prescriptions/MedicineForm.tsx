import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { commonMedicines, frequencies, durations, instructions } from '@/data/medicalData';
import { cn } from '@/lib/utils';
import { Medicine } from '@/contexts/DataContext';

interface MedicineFormProps {
  medicines: Omit<Medicine, 'id'>[];
  onChange: (medicines: Omit<Medicine, 'id'>[]) => void;
}

export const MedicineForm: React.FC<MedicineFormProps> = ({ medicines, onChange }) => {
  const { t, language } = useLanguage();

  const addMedicine = () => {
    onChange([
      ...medicines,
      {
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
      },
    ]);
  };

  const updateMedicine = (index: number, field: keyof Omit<Medicine, 'id'>, value: string) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeMedicine = (index: number) => {
    onChange(medicines.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {medicines.map((medicine, index) => (
        <MedicineItem
          key={index}
          medicine={medicine}
          index={index}
          onUpdate={updateMedicine}
          onRemove={removeMedicine}
          language={language}
          t={t}
        />
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addMedicine}
        className="w-full gap-2 border-dashed border-2"
      >
        <Plus className="w-4 h-4" />
        {t('prescriptions.addMedicine')}
      </Button>
    </div>
  );
};

interface MedicineItemProps {
  medicine: Omit<Medicine, 'id'>;
  index: number;
  onUpdate: (index: number, field: keyof Omit<Medicine, 'id'>, value: string) => void;
  onRemove: (index: number) => void;
  language: 'ar' | 'en';
  t: (key: string) => string;
}

const MedicineItem: React.FC<MedicineItemProps> = ({
  medicine,
  index,
  onUpdate,
  onRemove,
  language,
  t,
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const filteredMedicines = useMemo(() => {
    if (!searchValue) return commonMedicines;
    const search = searchValue.toLowerCase();
    return commonMedicines.filter(
      (m) =>
        m.name.toLowerCase().includes(search) ||
        m.nameEn.toLowerCase().includes(search)
    );
  }, [searchValue]);

  const selectedMedicine = commonMedicines.find(
    (m) => m.name === medicine.name || m.nameEn === medicine.name
  );

  return (
    <div className="bg-muted/50 rounded-xl p-4 space-y-4 relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-2 left-2 h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={() => onRemove(index)}
      >
        <X className="w-4 h-4" />
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
        {/* Medicine Name with Autocomplete */}
        <div className="md:col-span-2">
          <Label>{t('prescriptions.medicine')}</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between mt-1.5 bg-card"
              >
                {medicine.name || t('prescriptions.medicine') + '...'}
                <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput
                  placeholder={t('common.search') + '...'}
                  value={searchValue}
                  onValueChange={setSearchValue}
                />
                <CommandList>
                  <CommandEmpty>
                    <div className="p-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          onUpdate(index, 'name', searchValue);
                          setOpen(false);
                        }}
                      >
                        <Plus className="w-4 h-4 me-2" />
                        {language === 'ar' ? 'إضافة' : 'Add'} "{searchValue}"
                      </Button>
                    </div>
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredMedicines.map((m) => (
                      <CommandItem
                        key={m.nameEn}
                        value={m.nameEn}
                        onSelect={() => {
                          onUpdate(index, 'name', language === 'ar' ? m.name : m.nameEn);
                          if (m.dosages.length === 1) {
                            onUpdate(index, 'dosage', m.dosages[0]);
                          }
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'me-2 h-4 w-4',
                            medicine.name === m.name || medicine.name === m.nameEn
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                        <span>{language === 'ar' ? m.name : m.nameEn}</span>
                        <span className="text-muted-foreground ms-2 text-sm">
                          ({language === 'ar' ? m.nameEn : m.name})
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Dosage */}
        <div>
          <Label>{t('prescriptions.dosage')}</Label>
          {selectedMedicine && selectedMedicine.dosages.length > 1 ? (
            <Select
              value={medicine.dosage}
              onValueChange={(value) => onUpdate(index, 'dosage', value)}
            >
              <SelectTrigger className="mt-1.5 bg-card">
                <SelectValue placeholder={t('prescriptions.dosage')} />
              </SelectTrigger>
              <SelectContent>
                {selectedMedicine.dosages.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={medicine.dosage}
              onChange={(e) => onUpdate(index, 'dosage', e.target.value)}
              placeholder="500mg"
              className="mt-1.5 bg-card"
            />
          )}
        </div>

        {/* Frequency */}
        <div>
          <Label>{t('prescriptions.frequency')}</Label>
          <Select
            value={medicine.frequency}
            onValueChange={(value) => onUpdate(index, 'frequency', value)}
          >
            <SelectTrigger className="mt-1.5 bg-card">
              <SelectValue placeholder={t('prescriptions.frequency')} />
            </SelectTrigger>
            <SelectContent>
              {frequencies.map((f) => (
                <SelectItem key={f.en} value={language === 'ar' ? f.ar : f.en}>
                  {language === 'ar' ? f.ar : f.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Duration */}
        <div>
          <Label>{t('prescriptions.duration')}</Label>
          <Select
            value={medicine.duration}
            onValueChange={(value) => onUpdate(index, 'duration', value)}
          >
            <SelectTrigger className="mt-1.5 bg-card">
              <SelectValue placeholder={t('prescriptions.duration')} />
            </SelectTrigger>
            <SelectContent>
              {durations.map((d) => (
                <SelectItem key={d.en} value={language === 'ar' ? d.ar : d.en}>
                  {language === 'ar' ? d.ar : d.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Instructions */}
        <div>
          <Label>{t('prescriptions.instructions')}</Label>
          <Select
            value={medicine.instructions}
            onValueChange={(value) => onUpdate(index, 'instructions', value)}
          >
            <SelectTrigger className="mt-1.5 bg-card">
              <SelectValue placeholder={t('prescriptions.instructions')} />
            </SelectTrigger>
            <SelectContent>
              {instructions.map((i) => (
                <SelectItem key={i.en} value={language === 'ar' ? i.ar : i.en}>
                  {language === 'ar' ? i.ar : i.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
