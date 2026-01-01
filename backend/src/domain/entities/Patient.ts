export interface Patient {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: 'male' | 'female';
  nationalId: string;
  medicalHistory: string;
  allergies: string[];
  doctorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreatePatientInput = Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePatientInput = Partial<Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>>;
