export type LabCategory = 'cbc' | 'sugar' | 'liver' | 'kidney' | 'lipids' | 'thyroid' | 'urine';

export interface LabResult {
  id: string;
  patientId: string;
  doctorId: string;
  category: LabCategory;
  testName: string;
  resultValue: string;
  unit: string | null;
  referenceRange: string | null;
  isAbnormal: boolean;
  testDate: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLabResultInput {
  patientId: string;
  doctorId: string;
  category: LabCategory;
  testName: string;
  resultValue: string;
  unit?: string;
  referenceRange?: string;
  isAbnormal?: boolean;
  testDate: Date;
  notes?: string;
}

export interface UpdateLabResultInput {
  category?: LabCategory;
  testName?: string;
  resultValue?: string;
  unit?: string;
  referenceRange?: string;
  isAbnormal?: boolean;
  testDate?: Date;
  notes?: string;
}
