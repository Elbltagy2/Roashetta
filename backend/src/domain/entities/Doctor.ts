export interface Doctor {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  specialization: string;
  phone: string;
  clinicName: string;
  clinicAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateDoctorInput = Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateDoctorInput = Partial<Omit<Doctor, 'id' | 'passwordHash' | 'createdAt' | 'updatedAt'>>;
export type DoctorPublic = Omit<Doctor, 'passwordHash'>;
