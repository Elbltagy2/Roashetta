export interface Patient {
  id: string;
  fileNumber: string;
  name: string;
  phone: string;
  age: number;
  gender: 'male' | 'female';
  medicalHistory: string;
  allergies: string[];
  doctorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreatePatientInput = Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePatientInput = Partial<Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>>;
