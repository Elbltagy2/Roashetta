import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, {
  Patient as ApiPatient,
  Visit as ApiVisit,
  PatientRecord as ApiPatientRecord,
  CreatePatientData,
  CreateVisitData,
  CreatePatientRecordData,
} from '../services/api';
import { useAuth } from './AuthContext';

export interface PatientRecord {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
  uploadedAt: Date;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: 'male' | 'female';
  nationalId: string;
  medicalHistory: string;
  allergies: string[];
  records: PatientRecord[];
  createdAt: Date;
}

export interface Vital {
  bloodPressure: string;
  temperature: number;
  weight: number;
}

export interface Visit {
  id: string;
  patientId: string;
  date: Date;
  chiefComplaint: string;
  chiefComplaintDrawing: string | null;
  diagnosis: string;
  diagnosisDrawing: string | null;
  notes: string;
  notesDrawing: string | null;
  vitals: Vital;
}

interface DataContextType {
  patients: Patient[];
  visits: Visit[];
  isLoading: boolean;
  error: string | null;
  refreshPatients: () => Promise<void>;
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'records'>) => Promise<Patient>;
  updatePatient: (id: string, data: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  getPatient: (id: string) => Patient | undefined;
  addVisit: (visit: Omit<Visit, 'id'>) => Promise<Visit>;
  getPatientVisits: (patientId: string) => Visit[];
  loadPatientVisits: (patientId: string) => Promise<Visit[]>;
  addPatientRecord: (patientId: string, record: Omit<PatientRecord, 'id' | 'uploadedAt'>) => Promise<void>;
  deletePatientRecord: (patientId: string, recordId: string) => Promise<void>;
  loadPatientRecords: (patientId: string) => Promise<PatientRecord[]>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper to convert API patient to local format
const convertApiPatient = (apiPatient: ApiPatient, records: PatientRecord[] = []): Patient => ({
  id: apiPatient.id,
  name: apiPatient.name,
  phone: apiPatient.phone,
  age: apiPatient.age,
  gender: apiPatient.gender,
  nationalId: apiPatient.nationalId,
  medicalHistory: apiPatient.medicalHistory,
  allergies: apiPatient.allergies || [],
  records,
  createdAt: new Date(apiPatient.createdAt),
});

// Helper to convert API visit to local format
const convertApiVisit = (apiVisit: ApiVisit): Visit => ({
  id: apiVisit.id,
  patientId: apiVisit.patientId,
  date: new Date(apiVisit.visitDate),
  chiefComplaint: apiVisit.chiefComplaint || '',
  chiefComplaintDrawing: apiVisit.chiefComplaintDrawing,
  diagnosis: apiVisit.diagnosis || '',
  diagnosisDrawing: apiVisit.diagnosisDrawing,
  notes: apiVisit.notes || '',
  notesDrawing: apiVisit.notesDrawing,
  vitals: {
    bloodPressure: apiVisit.vitals?.bloodPressure || '',
    temperature: apiVisit.vitals?.temperature || 0,
    weight: apiVisit.vitals?.weight || 0,
  },
});

// Helper to convert API record to local format
const convertApiRecord = (apiRecord: ApiPatientRecord): PatientRecord => ({
  id: apiRecord.id,
  name: apiRecord.name,
  type: apiRecord.fileType,
  dataUrl: apiRecord.fileUrl,
  uploadedAt: new Date(apiRecord.uploadedAt),
});

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPatients = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);
    try {
      const apiPatients = await api.getPatients();
      const convertedPatients = apiPatients.map(p => convertApiPatient(p));
      setPatients(convertedPatients);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patients');
      console.error('Failed to load patients:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Load patients when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshPatients();
    } else {
      setPatients([]);
      setVisits([]);
    }
  }, [isAuthenticated, refreshPatients]);

  const addPatient = async (patientData: Omit<Patient, 'id' | 'createdAt' | 'records'>): Promise<Patient> => {
    const createData: CreatePatientData = {
      name: patientData.name,
      phone: patientData.phone,
      age: patientData.age,
      gender: patientData.gender,
      nationalId: patientData.nationalId,
      medicalHistory: patientData.medicalHistory,
      allergies: patientData.allergies,
    };

    const apiPatient = await api.createPatient(createData);
    const newPatient = convertApiPatient(apiPatient);
    setPatients(prev => [...prev, newPatient]);
    return newPatient;
  };

  const updatePatient = async (id: string, data: Partial<Patient>) => {
    const updateData: Partial<CreatePatientData> = {};
    if (data.name) updateData.name = data.name;
    if (data.phone) updateData.phone = data.phone;
    if (data.age) updateData.age = data.age;
    if (data.gender) updateData.gender = data.gender;
    if (data.nationalId) updateData.nationalId = data.nationalId;
    if (data.medicalHistory) updateData.medicalHistory = data.medicalHistory;
    if (data.allergies) updateData.allergies = data.allergies;

    const apiPatient = await api.updatePatient(id, updateData);
    setPatients(prev =>
      prev.map(p => p.id === id ? { ...convertApiPatient(apiPatient), records: p.records } : p)
    );
  };

  const deletePatient = async (id: string) => {
    await api.deletePatient(id);
    setPatients(prev => prev.filter(p => p.id !== id));
    setVisits(prev => prev.filter(v => v.patientId !== id));
  };

  const getPatient = (id: string) => patients.find(p => p.id === id);

  const loadPatientVisits = async (patientId: string): Promise<Visit[]> => {
    const apiVisits = await api.getVisitsByPatient(patientId);
    const convertedVisits = apiVisits.map(convertApiVisit);

    // Update local visits cache
    setVisits(prev => {
      const otherVisits = prev.filter(v => v.patientId !== patientId);
      return [...otherVisits, ...convertedVisits];
    });

    return convertedVisits;
  };

  const addVisit = async (visitData: Omit<Visit, 'id'>): Promise<Visit> => {
    const createData: CreateVisitData = {
      patientId: visitData.patientId,
      chiefComplaint: visitData.chiefComplaint,
      chiefComplaintDrawing: visitData.chiefComplaintDrawing || undefined,
      diagnosis: visitData.diagnosis,
      diagnosisDrawing: visitData.diagnosisDrawing || undefined,
      notes: visitData.notes,
      notesDrawing: visitData.notesDrawing || undefined,
      vitals: {
        bloodPressure: visitData.vitals.bloodPressure,
        temperature: visitData.vitals.temperature,
        weight: visitData.vitals.weight,
      },
    };

    const apiVisit = await api.createVisit(createData);
    const newVisit = convertApiVisit(apiVisit);
    setVisits(prev => [...prev, newVisit]);
    return newVisit;
  };

  const getPatientVisits = (patientId: string) =>
    visits.filter(v => v.patientId === patientId);

  const loadPatientRecords = async (patientId: string): Promise<PatientRecord[]> => {
    const apiRecords = await api.getPatientRecords(patientId);
    const records = apiRecords.map(convertApiRecord);

    // Update patient's records in state
    setPatients(prev =>
      prev.map(p => p.id === patientId ? { ...p, records } : p)
    );

    return records;
  };

  const addPatientRecord = async (patientId: string, record: Omit<PatientRecord, 'id' | 'uploadedAt'>) => {
    const createData: CreatePatientRecordData = {
      patientId,
      name: record.name,
      fileType: record.type,
      fileUrl: record.dataUrl,
      fileSize: record.dataUrl.length,
    };

    const apiRecord = await api.uploadPatientRecord(createData);
    const newRecord = convertApiRecord(apiRecord);

    setPatients(prev =>
      prev.map(p =>
        p.id === patientId ? { ...p, records: [...p.records, newRecord] } : p
      )
    );
  };

  const deletePatientRecord = async (patientId: string, recordId: string) => {
    await api.deletePatientRecord(recordId);
    setPatients(prev =>
      prev.map(p =>
        p.id === patientId
          ? { ...p, records: p.records.filter(r => r.id !== recordId) }
          : p
      )
    );
  };

  return (
    <DataContext.Provider
      value={{
        patients,
        visits,
        isLoading,
        error,
        refreshPatients,
        addPatient,
        updatePatient,
        deletePatient,
        getPatient,
        addVisit,
        getPatientVisits,
        loadPatientVisits,
        addPatientRecord,
        deletePatientRecord,
        loadPatientRecords,
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
