import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api, {
  Patient as ApiPatient,
  Visit as ApiVisit,
  PatientRecord as ApiPatientRecord,
  PreviousInvestigation as ApiPreviousInvestigation,
  Expense as ApiExpense,
  LabResult as ApiLabResult,
  VisitAttachment as ApiVisitAttachment,
  CreatePatientData,
  CreateVisitData,
  UpdateVisitData,
  CreatePatientRecordData,
  CreatePreviousInvestigationData,
  CreateExpenseData,
  UpdateExpenseData,
  ExpenseCategory,
  LabCategory,
  CreateLabResultData,
  UpdateLabResultData,
  CreateVisitAttachmentData,
  VisitType,
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
  fileNumber?: string;
  name: string;
  phone: string;
  age: number;
  gender: 'male' | 'female';
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
  visitType: VisitType;
  price: number;
  chiefComplaint: string;
  chiefComplaintDrawing: string | null;
  diagnosis: string;
  diagnosisDrawing: string | null;
  notes: string;
  notesDrawing: string | null;
  notesDrawing2: string | null;
  notesDrawing3: string | null;
  // Medical History Fields
  pastMedicalHistoryDrawing: string | null;
  hpiDrawing: string | null;
  drugHistoryDrawing: string | null;
  familyHistoryDrawing: string | null;
  currentMedicationDrawing: string | null;
  // Radiology (3 pages)
  radiologyDrawing: string | null;
  radiologyDrawing2: string | null;
  radiologyDrawing3: string | null;
  // Lab Test Request (JSON string)
  labTestRequest: string | null;
  // Radiology Request (JSON string)
  radiologyRequest: string | null;
  // Medical Checklists (JSON string - combined 7 checklist forms)
  medicalChecklists: string | null;
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

export interface VisitAttachment {
  id: string;
  visitId: string;
  name: string;
  type: string;
  dataUrl: string;
  uploadedBy: string;
  uploaderType: 'doctor' | 'assistant';
  createdAt: Date;
}

export interface PreviousInvestigation {
  id: string;
  patientId: string;
  name: string;
  type: string;
  dataUrl: string;
  uploadedAt: Date;
}

interface DataContextType {
  patientsVersion: number;
  visits: Visit[];
  expenses: Expense[];
  currentPatient: Patient | null;
  isLoading: boolean;
  error: string | null;
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'records'>) => Promise<Patient>;
  updatePatient: (id: string, data: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  addVisit: (visit: Omit<Visit, 'id'>) => Promise<Visit>;
  updateVisit: (visitId: string, visit: Partial<Omit<Visit, 'id' | 'patientId'>>) => Promise<Visit>;
  deleteVisit: (visitId: string) => Promise<void>;
  updateVisitPrice: (visitId: string, price: number) => Promise<void>;
  getPatientVisits: (patientId: string) => Visit[];
  loadPatientVisits: (patientId: string) => Promise<Visit[]>;
  loadFullVisit: (visitId: string) => Promise<Visit>;
  addPatientRecord: (patientId: string, record: Omit<PatientRecord, 'id' | 'uploadedAt'>) => Promise<PatientRecord>;
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
  // Visit Attachments
  loadVisitAttachments: (visitId: string) => Promise<VisitAttachment[]>;
  uploadVisitAttachment: (visitId: string, attachment: Omit<VisitAttachment, 'id' | 'visitId' | 'uploadedBy' | 'uploaderType' | 'createdAt'>) => Promise<VisitAttachment>;
  deleteVisitAttachment: (id: string) => Promise<void>;
  getVisitAttachments: (visitId: string) => VisitAttachment[];
  // Previous Investigations
  loadPreviousInvestigations: (patientId: string) => Promise<PreviousInvestigation[]>;
  addPreviousInvestigation: (patientId: string, investigation: Omit<PreviousInvestigation, 'id' | 'patientId' | 'uploadedAt'>) => Promise<PreviousInvestigation>;
  deletePreviousInvestigation: (id: string) => Promise<void>;
  getPreviousInvestigations: (patientId: string) => PreviousInvestigation[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper to convert API patient to local format
const convertApiPatient = (apiPatient: ApiPatient, records: PatientRecord[] = []): Patient => ({
  id: apiPatient.id,
  fileNumber: apiPatient.fileNumber || '',
  name: apiPatient.name,
  phone: apiPatient.phone,
  age: apiPatient.age,
  gender: apiPatient.gender,
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
  visitType: apiVisit.visitType || 'new',
  price: apiVisit.price || 0,
  chiefComplaint: apiVisit.chiefComplaint || '',
  chiefComplaintDrawing: apiVisit.chiefComplaintDrawing,
  diagnosis: apiVisit.diagnosis || '',
  diagnosisDrawing: apiVisit.diagnosisDrawing,
  notes: apiVisit.notes || '',
  notesDrawing: apiVisit.notesDrawing,
  notesDrawing2: apiVisit.notesDrawing2 || null,
  notesDrawing3: apiVisit.notesDrawing3 || null,
  pastMedicalHistoryDrawing: apiVisit.pastMedicalHistoryDrawing || null,
  hpiDrawing: apiVisit.hpiDrawing || null,
  drugHistoryDrawing: apiVisit.drugHistoryDrawing || null,
  familyHistoryDrawing: apiVisit.familyHistoryDrawing || null,
  currentMedicationDrawing: apiVisit.currentMedicationDrawing || null,
  radiologyDrawing: apiVisit.radiologyDrawing || null,
  radiologyDrawing2: apiVisit.radiologyDrawing2 || null,
  radiologyDrawing3: apiVisit.radiologyDrawing3 || null,
  labTestRequest: apiVisit.labTestRequest || null,
  radiologyRequest: apiVisit.radiologyRequest || null,
  medicalChecklists: apiVisit.medicalChecklists || null,
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

// Helper to convert API visit attachment to local format
const convertApiVisitAttachment = (apiAttachment: ApiVisitAttachment): VisitAttachment => ({
  id: apiAttachment.id,
  visitId: apiAttachment.visitId,
  name: apiAttachment.name,
  type: apiAttachment.type,
  dataUrl: apiAttachment.dataUrl,
  uploadedBy: apiAttachment.uploadedBy,
  uploaderType: apiAttachment.uploaderType,
  createdAt: new Date(apiAttachment.createdAt),
});

// Helper to convert API previous investigation to local format
const convertApiPreviousInvestigation = (apiInvestigation: ApiPreviousInvestigation): PreviousInvestigation => ({
  id: apiInvestigation.id,
  patientId: apiInvestigation.patientId,
  name: apiInvestigation.name,
  type: apiInvestigation.fileType,
  dataUrl: apiInvestigation.fileUrl,
  uploadedAt: new Date(apiInvestigation.uploadedAt),
});

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [patientsVersion, setPatientsVersion] = useState(0);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currentPatient, setCurrentPatientState] = useState<Patient | null>(null);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [visitAttachments, setVisitAttachments] = useState<VisitAttachment[]>([]);
  const [previousInvestigations, setPreviousInvestigations] = useState<PreviousInvestigation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

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

  // Load expenses and current patient when authenticated
  useEffect(() => {
    if (isAuthenticated && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      refreshExpenses();
      refreshCurrentPatient();
    } else if (!isAuthenticated) {
      hasFetchedRef.current = false;
      setVisits([]);
      setExpenses([]);
      setCurrentPatientState(null);
      setLabResults([]);
      setPreviousInvestigations([]);
    }
  }, [isAuthenticated, refreshExpenses, refreshCurrentPatient]);

  const addPatient = async (patientData: Omit<Patient, 'id' | 'createdAt' | 'records'>): Promise<Patient> => {
    const createData: CreatePatientData = {
      fileNumber: patientData.fileNumber,
      name: patientData.name,
      phone: patientData.phone,
      age: patientData.age,
      gender: patientData.gender,
      medicalHistory: patientData.medicalHistory,
      allergies: patientData.allergies,
    };

    const apiPatient = await api.createPatient(createData);
    const newPatient = convertApiPatient(apiPatient);
    setPatientsVersion(v => v + 1);
    return newPatient;
  };

  const updatePatient = async (id: string, data: Partial<Patient>) => {
    const updateData: Partial<CreatePatientData> = {};
    if (data.fileNumber) updateData.fileNumber = data.fileNumber;
    if (data.name) updateData.name = data.name;
    if (data.phone) updateData.phone = data.phone;
    if (data.age) updateData.age = data.age;
    if (data.gender) updateData.gender = data.gender;
    if (data.medicalHistory) updateData.medicalHistory = data.medicalHistory;
    if (data.allergies) updateData.allergies = data.allergies;

    await api.updatePatient(id, updateData);
    setPatientsVersion(v => v + 1);
  };

  const deletePatient = async (id: string) => {
    await api.deletePatient(id);
    setPatientsVersion(v => v + 1);
    setVisits(prev => prev.filter(v => v.patientId !== id));
  };

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

  // Fetch a single visit with all drawings/checklists (the list endpoint
  // strips them for speed). Used by pages that actually need the full
  // payload — VisitDetailPage, NewVisitPage edit mode, prev-visit PDF.
  const loadFullVisit = useCallback(async (visitId: string): Promise<Visit> => {
    const apiVisit = await api.getVisit(visitId);
    const full = convertApiVisit(apiVisit);
    // Merge the full visit into the local cache so any other consumer
    // gets the rich version on next render.
    setVisits(prev => {
      const without = prev.filter(v => v.id !== visitId);
      return [...without, full];
    });
    return full;
  }, []);

  const addVisit = async (visitData: Omit<Visit, 'id'>): Promise<Visit> => {
    const createData: CreateVisitData = {
      patientId: visitData.patientId,
      visitType: visitData.visitType,
      price: visitData.price,
      chiefComplaint: visitData.chiefComplaint,
      chiefComplaintDrawing: visitData.chiefComplaintDrawing || undefined,
      diagnosis: visitData.diagnosis,
      diagnosisDrawing: visitData.diagnosisDrawing || undefined,
      notes: visitData.notes,
      notesDrawing: visitData.notesDrawing || undefined,
      notesDrawing2: visitData.notesDrawing2 || undefined,
      notesDrawing3: visitData.notesDrawing3 || undefined,
      // Medical History Fields
      pastMedicalHistoryDrawing: visitData.pastMedicalHistoryDrawing || undefined,
      hpiDrawing: visitData.hpiDrawing || undefined,
      drugHistoryDrawing: visitData.drugHistoryDrawing || undefined,
      familyHistoryDrawing: visitData.familyHistoryDrawing || undefined,
      currentMedicationDrawing: visitData.currentMedicationDrawing || undefined,
      // Radiology (3 pages)
      radiologyDrawing: visitData.radiologyDrawing || undefined,
      radiologyDrawing2: visitData.radiologyDrawing2 || undefined,
      radiologyDrawing3: visitData.radiologyDrawing3 || undefined,
      // Lab Test Request
      labTestRequest: visitData.labTestRequest || undefined,
      // Radiology Request
      radiologyRequest: visitData.radiologyRequest || undefined,
      // Medical Checklists
      medicalChecklists: visitData.medicalChecklists || undefined,
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

  const updateVisit = async (visitId: string, visitData: Partial<Omit<Visit, 'id' | 'patientId'>>): Promise<Visit> => {
    const updateData: UpdateVisitData = {
      visitType: visitData.visitType,
      price: visitData.price,
      chiefComplaint: visitData.chiefComplaint,
      chiefComplaintDrawing: visitData.chiefComplaintDrawing,
      diagnosis: visitData.diagnosis,
      diagnosisDrawing: visitData.diagnosisDrawing,
      notes: visitData.notes,
      notesDrawing: visitData.notesDrawing,
      notesDrawing2: visitData.notesDrawing2,
      notesDrawing3: visitData.notesDrawing3,
      pastMedicalHistoryDrawing: visitData.pastMedicalHistoryDrawing,
      hpiDrawing: visitData.hpiDrawing,
      drugHistoryDrawing: visitData.drugHistoryDrawing,
      familyHistoryDrawing: visitData.familyHistoryDrawing,
      currentMedicationDrawing: visitData.currentMedicationDrawing,
      radiologyDrawing: visitData.radiologyDrawing,
      radiologyDrawing2: visitData.radiologyDrawing2,
      radiologyDrawing3: visitData.radiologyDrawing3,
      labTestRequest: visitData.labTestRequest,
      radiologyRequest: visitData.radiologyRequest,
      medicalChecklists: visitData.medicalChecklists,
      vitals: visitData.vitals,
    };

    const apiVisit = await api.updateVisit(visitId, updateData);
    const updatedVisit = convertApiVisit(apiVisit);
    setVisits(prev => prev.map(v => v.id === visitId ? updatedVisit : v));
    return updatedVisit;
  };

  const deleteVisit = async (visitId: string) => {
    await api.deleteVisit(visitId);
    setVisits(prev => prev.filter(v => v.id !== visitId));
  };

  const updateVisitPrice = async (visitId: string, price: number) => {
    const apiVisit = await api.updateVisitPrice(visitId, price);
    const updatedVisit = convertApiVisit(apiVisit);
    setVisits(prev => prev.map(v => v.id === visitId ? updatedVisit : v));
  };

  const loadPatientRecords = useCallback(async (patientId: string): Promise<PatientRecord[]> => {
    const apiRecords = await api.getPatientRecords(patientId);
    return apiRecords.map(convertApiRecord);
  }, []);

  const addPatientRecord = async (patientId: string, record: Omit<PatientRecord, 'id' | 'uploadedAt'>): Promise<PatientRecord> => {
    const createData: CreatePatientRecordData = {
      patientId,
      name: record.name,
      fileType: record.type,
      fileUrl: record.dataUrl,
      fileSize: record.dataUrl.startsWith('data:') ? Math.round(record.dataUrl.length * 0.75) : 0,
    };
    const apiRecord = await api.uploadPatientRecord(createData);
    return convertApiRecord(apiRecord);
  };

  const deletePatientRecord = async (_patientId: string, recordId: string) => {
    await api.deletePatientRecord(recordId);
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

  // Visit Attachment methods
  const loadVisitAttachments = useCallback(async (visitId: string): Promise<VisitAttachment[]> => {
    const apiAttachments = await api.getVisitAttachments(visitId);
    const convertedAttachments = apiAttachments.map(convertApiVisitAttachment);

    // Update local attachments cache
    setVisitAttachments(prev => {
      const otherAttachments = prev.filter(a => a.visitId !== visitId);
      return [...otherAttachments, ...convertedAttachments];
    });

    return convertedAttachments;
  }, []);

  const uploadVisitAttachment = async (
    visitId: string,
    attachment: Omit<VisitAttachment, 'id' | 'visitId' | 'uploadedBy' | 'uploaderType' | 'createdAt'>
  ): Promise<VisitAttachment> => {
    const createData: CreateVisitAttachmentData = {
      name: attachment.name,
      type: attachment.type,
      dataUrl: attachment.dataUrl,
    };

    const apiAttachment = await api.uploadVisitAttachment(visitId, createData);
    const newAttachment = convertApiVisitAttachment(apiAttachment);
    setVisitAttachments(prev => [newAttachment, ...prev]);
    return newAttachment;
  };

  const deleteVisitAttachment = async (id: string) => {
    await api.deleteVisitAttachment(id);
    setVisitAttachments(prev => prev.filter(a => a.id !== id));
  };

  const getVisitAttachments = useCallback((visitId: string) =>
    visitAttachments.filter(a => a.visitId === visitId), [visitAttachments]);

  // Previous Investigation methods
  const loadPreviousInvestigations = useCallback(async (patientId: string): Promise<PreviousInvestigation[]> => {
    const apiInvestigations = await api.getPreviousInvestigations(patientId);
    const convertedInvestigations = apiInvestigations.map(convertApiPreviousInvestigation);

    // Update local previous investigations cache
    setPreviousInvestigations(prev => {
      const otherInvestigations = prev.filter(i => i.patientId !== patientId);
      return [...otherInvestigations, ...convertedInvestigations];
    });

    return convertedInvestigations;
  }, []);

  const addPreviousInvestigation = async (
    patientId: string,
    investigation: Omit<PreviousInvestigation, 'id' | 'patientId' | 'uploadedAt'>
  ): Promise<PreviousInvestigation> => {
    const createData: CreatePreviousInvestigationData = {
      patientId,
      name: investigation.name,
      fileType: investigation.type,
      fileUrl: investigation.dataUrl,
      fileSize: investigation.dataUrl.startsWith('data:') ? Math.round(investigation.dataUrl.length * 0.75) : 0,
    };

    const apiInvestigation = await api.uploadPreviousInvestigation(createData);
    const newInvestigation = convertApiPreviousInvestigation(apiInvestigation);
    setPreviousInvestigations(prev => [newInvestigation, ...prev]);
    return newInvestigation;
  };

  const deletePreviousInvestigation = async (id: string) => {
    await api.deletePreviousInvestigation(id);
    setPreviousInvestigations(prev => prev.filter(i => i.id !== id));
  };

  const getPreviousInvestigations = useCallback((patientId: string) =>
    previousInvestigations.filter(i => i.patientId === patientId), [previousInvestigations]);

  return (
    <DataContext.Provider
      value={{
        patientsVersion,
        visits,
        expenses,
        currentPatient,
        isLoading,
        error,
        addPatient,
        updatePatient,
        deletePatient,
        addVisit,
        updateVisit,
        deleteVisit,
        updateVisitPrice,
        getPatientVisits,
        loadPatientVisits,
        loadFullVisit,
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
        loadVisitAttachments,
        uploadVisitAttachment,
        deleteVisitAttachment,
        getVisitAttachments,
        loadPreviousInvestigations,
        addPreviousInvestigation,
        deletePreviousInvestigation,
        getPreviousInvestigations,
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
