import React, { createContext, useContext, useState } from 'react';

export interface Patient {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: 'male' | 'female';
  nationalId: string;
  medicalHistory: string;
  allergies: string[];
  createdAt: Date;
}

export interface Vital {
  bloodPressure: string;
  temperature: number;
  weight: number;
}

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface Prescription {
  id: string;
  visitId: string;
  medicines: Medicine[];
  createdAt: Date;
}

export interface Visit {
  id: string;
  patientId: string;
  date: Date;
  chiefComplaint: string;
  diagnosis: string;
  notes: string;
  vitals: Vital;
  prescription?: Prescription;
}

interface DataContextType {
  patients: Patient[];
  visits: Visit[];
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt'>) => Patient;
  updatePatient: (id: string, data: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  getPatient: (id: string) => Patient | undefined;
  addVisit: (visit: Omit<Visit, 'id'>) => Visit;
  getPatientVisits: (patientId: string) => Visit[];
  addPrescription: (visitId: string, medicines: Omit<Medicine, 'id'>[]) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Mock data
const initialPatients: Patient[] = [
  {
    id: '1',
    name: 'محمد أحمد علي',
    phone: '01012345678',
    age: 45,
    gender: 'male',
    nationalId: '28501011234567',
    medicalHistory: 'ارتفاع ضغط الدم، السكري من النوع الثاني',
    allergies: ['البنسلين', 'الأسبرين'],
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'فاطمة حسن محمود',
    phone: '01098765432',
    age: 32,
    gender: 'female',
    nationalId: '29203021234567',
    medicalHistory: 'لا يوجد',
    allergies: [],
    createdAt: new Date('2024-02-20'),
  },
  {
    id: '3',
    name: 'أحمد سمير عبدالله',
    phone: '01155443322',
    age: 28,
    gender: 'male',
    nationalId: '29605151234567',
    medicalHistory: 'حساسية موسمية',
    allergies: ['حبوب اللقاح'],
    createdAt: new Date('2024-03-10'),
  },
];

const initialVisits: Visit[] = [
  {
    id: '1',
    patientId: '1',
    date: new Date('2024-12-20'),
    chiefComplaint: 'صداع مستمر منذ 3 أيام',
    diagnosis: 'صداع توتري',
    notes: 'ينصح بالراحة وتقليل التوتر',
    vitals: {
      bloodPressure: '140/90',
      temperature: 37.2,
      weight: 82,
    },
    prescription: {
      id: '1',
      visitId: '1',
      medicines: [
        {
          id: '1',
          name: 'باراسيتامول',
          dosage: '500mg',
          frequency: 'ثلاث مرات يومياً',
          duration: '5 أيام',
          instructions: 'بعد الأكل',
        },
      ],
      createdAt: new Date('2024-12-20'),
    },
  },
  {
    id: '2',
    patientId: '2',
    date: new Date('2024-12-22'),
    chiefComplaint: 'كحة وسخونية',
    diagnosis: 'التهاب الحلق',
    notes: 'إكثار من السوائل الدافئة',
    vitals: {
      bloodPressure: '120/80',
      temperature: 38.5,
      weight: 65,
    },
  },
];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [visits, setVisits] = useState<Visit[]>(initialVisits);

  const addPatient = (patientData: Omit<Patient, 'id' | 'createdAt'>): Patient => {
    const newPatient: Patient = {
      ...patientData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setPatients((prev) => [...prev, newPatient]);
    return newPatient;
  };

  const updatePatient = (id: string, data: Partial<Patient>) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p))
    );
  };

  const deletePatient = (id: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== id));
    setVisits((prev) => prev.filter((v) => v.patientId !== id));
  };

  const getPatient = (id: string) => patients.find((p) => p.id === id);

  const addVisit = (visitData: Omit<Visit, 'id'>): Visit => {
    const newVisit: Visit = {
      ...visitData,
      id: Date.now().toString(),
    };
    setVisits((prev) => [...prev, newVisit]);
    return newVisit;
  };

  const getPatientVisits = (patientId: string) =>
    visits.filter((v) => v.patientId === patientId);

  const addPrescription = (visitId: string, medicines: Omit<Medicine, 'id'>[]) => {
    const prescription: Prescription = {
      id: Date.now().toString(),
      visitId,
      medicines: medicines.map((m, i) => ({ ...m, id: `${Date.now()}-${i}` })),
      createdAt: new Date(),
    };
    setVisits((prev) =>
      prev.map((v) => (v.id === visitId ? { ...v, prescription } : v))
    );
  };

  return (
    <DataContext.Provider
      value={{
        patients,
        visits,
        addPatient,
        updatePatient,
        deletePatient,
        getPatient,
        addVisit,
        getPatientVisits,
        addPrescription,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
