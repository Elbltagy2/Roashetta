import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api, {
  Patient as ApiPatient,
  Visit as ApiVisit,
  PatientRecord as ApiPatientRecord,
  Expense as ApiExpense,
  LabResult as ApiLabResult,
  CreatePatientData,
  CreateVisitData,
  CreatePatientRecordData,
  CreateExpenseData,
  UpdateExpenseData,
  ExpenseCategory,
  LabCategory,
  CreateLabResultData,
  UpdateLabResultData,
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
  // Medical History Fields
  pastMedicalHistoryDrawing: string | null;
  hpiDrawing: string | null;
  drugHistoryDrawing: string | null;
  familyHistoryDrawing: string | null;
  currentMedicationDrawing: string | null;
  // Requested Lab
  requestedLabDrawing: string | null;
  vitals: Vital;
}

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  expenseDate: Date;
  createdAt: Date;
}

export interface LabResult {
  id: string;
  patientId: string;
  category: LabCategory;
  testName: string;
  resultValue: string;
  unit: string | null;
  referenceRange: string | null;
  isAbnormal: boolean;
  testDate: Date;
  notes: string | null;
  createdAt: Date;
}

interface DataContextType {
  patients: Patient[];
  visits: Visit[];
  expenses: Expense[];
  currentPatient: Patient | null;
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
  // Expenses
  refreshExpenses: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<Expense>;
  updateExpense: (id: string, data: Partial<Omit<Expense, 'id' | 'createdAt'>>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  // Current Patient
  refreshCurrentPatient: () => Promise<void>;
  setCurrentPatient: (patientId: string) => Promise<void>;
  clearCurrentPatient: () => Promise<void>;
  // Lab Results
  loadLabResults: (patientId: string) => Promise<LabResult[]>;
  addLabResult: (labResult: Omit<LabResult, 'id' | 'createdAt'>) => Promise<LabResult>;
  updateLabResult: (id: string, data: Partial<Omit<LabResult, 'id' | 'patientId' | 'createdAt'>>) => Promise<void>;
  deleteLabResult: (id: string) => Promise<void>;
  getPatientLabResults: (patientId: string) => LabResult[];
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
  pastMedicalHistoryDrawing: apiVisit.pastMedicalHistoryDrawing || null,
  hpiDrawing: apiVisit.hpiDrawing || null,
  drugHistoryDrawing: apiVisit.drugHistoryDrawing || null,
  familyHistoryDrawing: apiVisit.familyHistoryDrawing || null,
  currentMedicationDrawing: apiVisit.currentMedicationDrawing || null,
  requestedLabDrawing: apiVisit.requestedLabDrawing || null,
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

// Helper to convert API expense to local format
const convertApiExpense = (apiExpense: ApiExpense): Expense => ({
  id: apiExpense.id,
  amount: apiExpense.amount,
  category: apiExpense.category,
  description: apiExpense.description,
  expenseDate: new Date(apiExpense.expenseDate),
  createdAt: new Date(apiExpense.createdAt),
});

// Helper to convert API lab result to local format
const convertApiLabResult = (apiLabResult: ApiLabResult): LabResult => ({
  id: apiLabResult.id,
  patientId: apiLabResult.patientId,
  category: apiLabResult.category,
  testName: apiLabResult.testName,
  resultValue: apiLabResult.resultValue,
  unit: apiLabResult.unit,
  referenceRange: apiLabResult.referenceRange,
  isAbnormal: apiLabResult.isAbnormal,
  testDate: new Date(apiLabResult.testDate),
  notes: apiLabResult.notes,
  createdAt: new Date(apiLabResult.createdAt),
});

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currentPatient, setCurrentPatientState] = useState<Patient | null>(null);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

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

  const refreshExpenses = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const apiExpenses = await api.getExpenses();
      const convertedExpenses = apiExpenses.map(convertApiExpense);
      setExpenses(convertedExpenses);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    }
  }, [isAuthenticated]);

  const refreshCurrentPatient = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await api.getCurrentPatient();
      if (response.currentPatient) {
        setCurrentPatientState(convertApiPatient(response.currentPatient));
      } else {
        setCurrentPatientState(null);
      }
    } catch (err) {
      console.error('Failed to load current patient:', err);
      setCurrentPatientState(null);
    }
  }, [isAuthenticated]);

  // Load patients, expenses, and current patient when authenticated
  useEffect(() => {
    if (isAuthenticated && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      refreshPatients();
      refreshExpenses();
      refreshCurrentPatient();
    } else if (!isAuthenticated) {
      hasFetchedRef.current = false;
      setPatients([]);
      setVisits([]);
      setExpenses([]);
      setCurrentPatientState(null);
      setLabResults([]);
    }
  }, [isAuthenticated, refreshPatients, refreshExpenses, refreshCurrentPatient]);

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

  const loadPatientVisits = useCallback(async (patientId: string): Promise<Visit[]> => {
    const apiVisits = await api.getVisitsByPatient(patientId);
    const convertedVisits = apiVisits.map(convertApiVisit);

    // Update local visits cache
    setVisits(prev => {
      const otherVisits = prev.filter(v => v.patientId !== patientId);
      return [...otherVisits, ...convertedVisits];
    });

    return convertedVisits;
  }, []);

  const addVisit = async (visitData: Omit<Visit, 'id'>): Promise<Visit> => {
    const createData: CreateVisitData = {
      patientId: visitData.patientId,
      chiefComplaint: visitData.chiefComplaint,
      chiefComplaintDrawing: visitData.chiefComplaintDrawing || undefined,
      diagnosis: visitData.diagnosis,
      diagnosisDrawing: visitData.diagnosisDrawing || undefined,
      notes: visitData.notes,
      notesDrawing: visitData.notesDrawing || undefined,
      // Medical History Fields
      pastMedicalHistoryDrawing: visitData.pastMedicalHistoryDrawing || undefined,
      hpiDrawing: visitData.hpiDrawing || undefined,
      drugHistoryDrawing: visitData.drugHistoryDrawing || undefined,
      familyHistoryDrawing: visitData.familyHistoryDrawing || undefined,
      currentMedicationDrawing: visitData.currentMedicationDrawing || undefined,
      // Requested Lab
      requestedLabDrawing: visitData.requestedLabDrawing || undefined,
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

  const loadPatientRecords = useCallback(async (patientId: string): Promise<PatientRecord[]> => {
    const apiRecords = await api.getPatientRecords(patientId);
    const records = apiRecords.map(convertApiRecord);

    // Update patient's records in state
    setPatients(prev =>
      prev.map(p => p.id === patientId ? { ...p, records } : p)
    );

    return records;
  }, []);

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

  // Expense methods
  const addExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> => {
    const createData: CreateExpenseData = {
      amount: expenseData.amount,
      category: expenseData.category,
      description: expenseData.description,
      expenseDate: expenseData.expenseDate.toISOString().split('T')[0],
    };

    const apiExpense = await api.createExpense(createData);
    const newExpense = convertApiExpense(apiExpense);
    setExpenses(prev => [newExpense, ...prev]);
    return newExpense;
  };

  const updateExpense = async (id: string, data: Partial<Omit<Expense, 'id' | 'createdAt'>>) => {
    const updateData: UpdateExpenseData = {};
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.expenseDate !== undefined) updateData.expenseDate = data.expenseDate.toISOString().split('T')[0];

    const apiExpense = await api.updateExpense(id, updateData);
    const updatedExpense = convertApiExpense(apiExpense);
    setExpenses(prev => prev.map(e => e.id === id ? updatedExpense : e));
  };

  const deleteExpense = async (id: string) => {
    await api.deleteExpense(id);
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // Current Patient methods
  const setCurrentPatient = async (patientId: string) => {
    const response = await api.setCurrentPatient(patientId);
    if (response.currentPatient) {
      setCurrentPatientState(convertApiPatient(response.currentPatient));
    }
  };

  const clearCurrentPatient = async () => {
    await api.clearCurrentPatient();
    setCurrentPatientState(null);
  };

  // Lab Result methods
  const loadLabResults = async (patientId: string): Promise<LabResult[]> => {
    const apiLabResults = await api.getLabResults(patientId);
    const convertedLabResults = apiLabResults.map(convertApiLabResult);

    // Update local lab results cache
    setLabResults(prev => {
      const otherResults = prev.filter(r => r.patientId !== patientId);
      return [...otherResults, ...convertedLabResults];
    });

    return convertedLabResults;
  };

  const addLabResult = async (labResultData: Omit<LabResult, 'id' | 'createdAt'>): Promise<LabResult> => {
    const createData: CreateLabResultData = {
      patientId: labResultData.patientId,
      category: labResultData.category,
      testName: labResultData.testName,
      resultValue: labResultData.resultValue,
      unit: labResultData.unit || undefined,
      referenceRange: labResultData.referenceRange || undefined,
      isAbnormal: labResultData.isAbnormal,
      testDate: labResultData.testDate instanceof Date
        ? labResultData.testDate.toISOString().split('T')[0]
        : new Date(labResultData.testDate).toISOString().split('T')[0],
      notes: labResultData.notes || undefined,
    };

    const apiLabResult = await api.createLabResult(createData);
    const newLabResult = convertApiLabResult(apiLabResult);
    setLabResults(prev => [newLabResult, ...prev]);
    return newLabResult;
  };

  const updateLabResult = async (id: string, data: Partial<Omit<LabResult, 'id' | 'patientId' | 'createdAt'>>) => {
    const updateData: UpdateLabResultData = {};
    if (data.category !== undefined) updateData.category = data.category;
    if (data.testName !== undefined) updateData.testName = data.testName;
    if (data.resultValue !== undefined) updateData.resultValue = data.resultValue;
    if (data.unit !== undefined) updateData.unit = data.unit || undefined;
    if (data.referenceRange !== undefined) updateData.referenceRange = data.referenceRange || undefined;
    if (data.isAbnormal !== undefined) updateData.isAbnormal = data.isAbnormal;
    if (data.testDate !== undefined) {
      updateData.testDate = data.testDate instanceof Date
        ? data.testDate.toISOString().split('T')[0]
        : new Date(data.testDate).toISOString().split('T')[0];
    }
    if (data.notes !== undefined) updateData.notes = data.notes || undefined;

    const apiLabResult = await api.updateLabResult(id, updateData);
    const updatedLabResult = convertApiLabResult(apiLabResult);
    setLabResults(prev => prev.map(r => r.id === id ? updatedLabResult : r));
  };

  const deleteLabResult = async (id: string) => {
    await api.deleteLabResult(id);
    setLabResults(prev => prev.filter(r => r.id !== id));
  };

  const getPatientLabResults = (patientId: string) =>
    labResults.filter(r => r.patientId === patientId);

  return (
    <DataContext.Provider
      value={{
        patients,
        visits,
        expenses,
        currentPatient,
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
        refreshExpenses,
        addExpense,
        updateExpense,
        deleteExpense,
        refreshCurrentPatient,
        setCurrentPatient,
        clearCurrentPatient,
        loadLabResults,
        addLabResult,
        updateLabResult,
        deleteLabResult,
        getPatientLabResults,
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
