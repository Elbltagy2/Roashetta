export interface Settings {
  id: string;
  doctorId: string;
  newVisitPrice: number;
  followupVisitPrice: number;
  backupPath: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateSettingsInput = Omit<Settings, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateSettingsInput = Partial<Omit<Settings, 'id' | 'doctorId' | 'createdAt' | 'updatedAt'>>;
