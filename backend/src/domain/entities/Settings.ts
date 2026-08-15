export interface Settings {
  id: string;
  doctorId: string;
  newVisitPrice: number;        // كشف
  followupVisitPrice: number;   // نص كشف
  consultationPrice: number;    // استشارة (كشف مجاني is always 0)
  backupPath: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateSettingsInput = Omit<Settings, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateSettingsInput = Partial<Omit<Settings, 'id' | 'doctorId' | 'createdAt' | 'updatedAt'>>;
