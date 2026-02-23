// Mock API for demo mode (Vercel deployment without backend)
import { Notification } from '../types/notification';

// Generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Demo data
const DEMO_DOCTOR = {
  id: 'demo-doctor-1',
  email: 'demo@roashetta.com',
  name: 'د. أحمد محمد',
  role: 'doctor' as const,
  specialization: 'طب عام',
  clinicName: 'عيادة روشتة',
};

const DEMO_PATIENTS = [
  {
    id: 'patient-1',
    doctorId: 'demo-doctor-1',
    fileNumber: '001',
    name: 'محمد أحمد علي',
    phone: '01012345678',
    age: 35,
    gender: 'male' as const,
    medicalHistory: 'لا يوجد أمراض مزمنة',
    allergies: ['البنسلين'],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'patient-2',
    doctorId: 'demo-doctor-1',
    fileNumber: '002',
    name: 'فاطمة محمود حسن',
    phone: '01098765432',
    age: 28,
    gender: 'female' as const,
    medicalHistory: 'ضغط دم مرتفع',
    allergies: [],
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'patient-3',
    doctorId: 'demo-doctor-1',
    fileNumber: '003',
    name: 'أحمد سمير عبدالله',
    phone: '01155555555',
    age: 45,
    gender: 'male' as const,
    medicalHistory: 'سكري نوع 2',
    allergies: ['السلفا'],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEMO_VISITS = [
  {
    id: 'visit-1',
    patientId: 'patient-1',
    doctorId: 'demo-doctor-1',
    visitDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    visitType: 'new' as const,
    price: 200,
    chiefComplaint: 'صداع وارتفاع في درجة الحرارة',
    chiefComplaintDrawing: null,
    diagnosis: 'نزلة برد',
    diagnosisDrawing: null,
    notes: 'راحة تامة وشرب سوائل كثيرة',
    notesDrawing: null,
    notesDrawing2: null,
    notesDrawing3: null,
    pastMedicalHistoryDrawing: null,
    hpiDrawing: null,
    drugHistoryDrawing: null,
    familyHistoryDrawing: null,
    currentMedicationDrawing: null,
    radiologyDrawing: null,
    radiologyDrawing2: null,
    radiologyDrawing3: null,
    labTestRequest: null,
    vitals: { bloodPressure: '120/80', temperature: 38.5, weight: 75 },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'visit-2',
    patientId: 'patient-2',
    doctorId: 'demo-doctor-1',
    visitDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    visitType: 'new' as const,
    price: 200,
    chiefComplaint: 'ألم في الظهر',
    chiefComplaintDrawing: null,
    diagnosis: 'شد عضلي',
    diagnosisDrawing: null,
    notes: 'كمادات دافئة ومسكنات',
    notesDrawing: null,
    notesDrawing2: null,
    notesDrawing3: null,
    pastMedicalHistoryDrawing: null,
    hpiDrawing: null,
    drugHistoryDrawing: null,
    familyHistoryDrawing: null,
    currentMedicationDrawing: null,
    radiologyDrawing: null,
    radiologyDrawing2: null,
    radiologyDrawing3: null,
    labTestRequest: null,
    vitals: { bloodPressure: '140/90', temperature: 37, weight: 65 },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Storage keys
const STORAGE_KEYS = {
  patients: 'demo_patients',
  visits: 'demo_visits',
  records: 'demo_records',
  investigations: 'demo_investigations',
  expenses: 'demo_expenses',
  labResults: 'demo_labResults',
  settings: 'demo_settings',
  notifications: 'demo_notifications',
  currentPatient: 'demo_currentPatient',
  queue: 'demo_queue',
  initialized: 'demo_initialized',
};

// Initialize demo data
function initializeDemoData() {
  if (!localStorage.getItem(STORAGE_KEYS.initialized)) {
    localStorage.setItem(STORAGE_KEYS.patients, JSON.stringify(DEMO_PATIENTS));
    localStorage.setItem(STORAGE_KEYS.visits, JSON.stringify(DEMO_VISITS));
    localStorage.setItem(STORAGE_KEYS.records, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.investigations, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.labResults, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify({
      doctorId: 'demo-doctor-1',
      newVisitPrice: 200,
      followupVisitPrice: 100,
    }));
    localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.initialized, 'true');
  }
}

// Helper to get data from localStorage
function getData<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setData<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Types (reusing from api.ts)
import type {
  User,
  Patient,
  CreatePatientData,
  Visit,
  CreateVisitData,
  UpdateVisitData,
  PatientRecord,
  CreatePatientRecordData,
  PreviousInvestigation,
  CreatePreviousInvestigationData,
  VisitAttachment,
  CreateVisitAttachmentData,
  Expense,
  CreateExpenseData,
  UpdateExpenseData,
  LabResult,
  CreateLabResultData,
  UpdateLabResultData,
  Settings,
  UpdateSettingsData,
  AnalyticsData,
  Assistant,
  CreateAssistantData,
  UpdateAssistantData,
  QueueEntry,
  UpdateQueueEntryData,
} from './api';

type AuthErrorCallback = () => void;

class MockApiClient {
  private token: string | null = null;
  private onAuthError: AuthErrorCallback | null = null;

  constructor() {
    this.token = localStorage.getItem('demo_token');
    initializeDemoData();
  }

  setAuthErrorHandler(callback: AuthErrorCallback | null) {
    this.onAuthError = callback;
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('demo_token', token);
    } else {
      localStorage.removeItem('demo_token');
    }
  }

  getToken() {
    return this.token;
  }

  // Auth - Auto login for demo
  async register() {
    return { message: 'تم التسجيل بنجاح', doctor: DEMO_DOCTOR };
  }

  async login(_email: string, _password: string) {
    const token = 'demo-token-' + generateId();
    this.setToken(token);
    localStorage.setItem('user', JSON.stringify(DEMO_DOCTOR));
    return { token, user: DEMO_DOCTOR as User };
  }

  logout() {
    this.setToken(null);
    localStorage.removeItem('user');
  }

  // Assistants
  async getAssistants(): Promise<Assistant[]> {
    return [];
  }

  async createAssistant(_data: CreateAssistantData): Promise<Assistant> {
    throw new Error('Demo mode: Cannot create assistants');
  }

  async updateAssistant(_id: string, _data: UpdateAssistantData): Promise<Assistant> {
    throw new Error('Demo mode: Cannot update assistants');
  }

  async deleteAssistant(_id: string): Promise<void> {
    throw new Error('Demo mode: Cannot delete assistants');
  }

  // Patients
  async getPatients(): Promise<Patient[]> {
    return getData<Patient>(STORAGE_KEYS.patients);
  }

  async getPatient(id: string): Promise<Patient> {
    const patients = getData<Patient>(STORAGE_KEYS.patients);
    const patient = patients.find(p => p.id === id);
    if (!patient) throw new Error('Patient not found');
    return patient;
  }

  async createPatient(data: CreatePatientData): Promise<Patient> {
    const patients = getData<Patient>(STORAGE_KEYS.patients);
    const newPatient: Patient = {
      id: generateId(),
      doctorId: 'demo-doctor-1',
      fileNumber: data.fileNumber || String(patients.length + 1).padStart(3, '0'),
      name: data.name,
      phone: data.phone,
      age: data.age,
      gender: data.gender,
      medicalHistory: data.medicalHistory,
      allergies: data.allergies,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    patients.push(newPatient);
    setData(STORAGE_KEYS.patients, patients);
    return newPatient;
  }

  async updatePatient(id: string, data: Partial<CreatePatientData>): Promise<Patient> {
    const patients = getData<Patient>(STORAGE_KEYS.patients);
    const index = patients.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Patient not found');
    patients[index] = { ...patients[index], ...data, updatedAt: new Date().toISOString() };
    setData(STORAGE_KEYS.patients, patients);
    return patients[index];
  }

  async deletePatient(id: string): Promise<void> {
    const patients = getData<Patient>(STORAGE_KEYS.patients);
    setData(STORAGE_KEYS.patients, patients.filter(p => p.id !== id));
  }

  async searchPatients(query: string): Promise<Patient[]> {
    const patients = getData<Patient>(STORAGE_KEYS.patients);
    const q = query.toLowerCase();
    return patients.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.fileNumber.includes(q)
    );
  }

  // Visits
  async getVisitsByPatient(patientId: string): Promise<Visit[]> {
    const visits = getData<Visit>(STORAGE_KEYS.visits);
    return visits.filter(v => v.patientId === patientId);
  }

  async getVisit(id: string): Promise<Visit> {
    const visits = getData<Visit>(STORAGE_KEYS.visits);
    const visit = visits.find(v => v.id === id);
    if (!visit) throw new Error('Visit not found');
    return visit;
  }

  async createVisit(data: CreateVisitData): Promise<Visit> {
    const visits = getData<Visit>(STORAGE_KEYS.visits);
    const newVisit: Visit = {
      id: generateId(),
      patientId: data.patientId,
      doctorId: 'demo-doctor-1',
      visitDate: new Date().toISOString(),
      visitType: data.visitType || 'new',
      price: data.price || 200,
      chiefComplaint: data.chiefComplaint || '',
      chiefComplaintDrawing: data.chiefComplaintDrawing || null,
      diagnosis: data.diagnosis || '',
      diagnosisDrawing: data.diagnosisDrawing || null,
      notes: data.notes || '',
      notesDrawing: data.notesDrawing || null,
      notesDrawing2: data.notesDrawing2 || null,
      notesDrawing3: data.notesDrawing3 || null,
      pastMedicalHistoryDrawing: data.pastMedicalHistoryDrawing || null,
      hpiDrawing: data.hpiDrawing || null,
      drugHistoryDrawing: data.drugHistoryDrawing || null,
      familyHistoryDrawing: data.familyHistoryDrawing || null,
      currentMedicationDrawing: data.currentMedicationDrawing || null,
      radiologyDrawing: data.radiologyDrawing || null,
      radiologyDrawing2: data.radiologyDrawing2 || null,
      radiologyDrawing3: data.radiologyDrawing3 || null,
      labTestRequest: data.labTestRequest || null,
      vitals: data.vitals || { bloodPressure: '', temperature: 0, weight: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    visits.push(newVisit);
    setData(STORAGE_KEYS.visits, visits);
    return newVisit;
  }

  async updateVisitPrice(visitId: string, price: number): Promise<Visit> {
    return this.updateVisit(visitId, { price });
  }

  async updateVisit(visitId: string, data: UpdateVisitData): Promise<Visit> {
    const visits = getData<Visit>(STORAGE_KEYS.visits);
    const index = visits.findIndex(v => v.id === visitId);
    if (index === -1) throw new Error('Visit not found');
    visits[index] = { ...visits[index], ...data, updatedAt: new Date().toISOString() };
    setData(STORAGE_KEYS.visits, visits);
    return visits[index];
  }

  // Patient Records
  async getPatientRecords(patientId: string): Promise<PatientRecord[]> {
    const records = getData<PatientRecord>(STORAGE_KEYS.records);
    return records.filter(r => r.patientId === patientId);
  }

  async uploadPatientRecord(data: CreatePatientRecordData): Promise<PatientRecord> {
    const records = getData<PatientRecord>(STORAGE_KEYS.records);
    const newRecord: PatientRecord = {
      id: generateId(),
      ...data,
      uploadedAt: new Date().toISOString(),
    };
    records.push(newRecord);
    setData(STORAGE_KEYS.records, records);
    return newRecord;
  }

  async deletePatientRecord(id: string): Promise<void> {
    const records = getData<PatientRecord>(STORAGE_KEYS.records);
    setData(STORAGE_KEYS.records, records.filter(r => r.id !== id));
  }

  // Previous Investigations
  async getPreviousInvestigations(patientId: string): Promise<PreviousInvestigation[]> {
    const investigations = getData<PreviousInvestigation>(STORAGE_KEYS.investigations);
    return investigations.filter(i => i.patientId === patientId);
  }

  async uploadPreviousInvestigation(data: CreatePreviousInvestigationData): Promise<PreviousInvestigation> {
    const investigations = getData<PreviousInvestigation>(STORAGE_KEYS.investigations);
    const newInvestigation: PreviousInvestigation = {
      id: generateId(),
      ...data,
      uploadedAt: new Date().toISOString(),
    };
    investigations.push(newInvestigation);
    setData(STORAGE_KEYS.investigations, investigations);
    return newInvestigation;
  }

  async deletePreviousInvestigation(id: string): Promise<void> {
    const investigations = getData<PreviousInvestigation>(STORAGE_KEYS.investigations);
    setData(STORAGE_KEYS.investigations, investigations.filter(i => i.id !== id));
  }

  // Visit Attachments (stored with visits)
  async getVisitAttachments(_visitId: string): Promise<VisitAttachment[]> {
    return [];
  }

  async uploadVisitAttachment(_visitId: string, _data: CreateVisitAttachmentData): Promise<VisitAttachment> {
    throw new Error('Demo mode: Attachments not supported');
  }

  async deleteVisitAttachment(_id: string): Promise<void> {
    throw new Error('Demo mode: Attachments not supported');
  }

  // Expenses
  async getExpenses(_startDate?: string, _endDate?: string): Promise<Expense[]> {
    return getData<Expense>(STORAGE_KEYS.expenses);
  }

  async createExpense(data: CreateExpenseData): Promise<Expense> {
    const expenses = getData<Expense>(STORAGE_KEYS.expenses);
    const newExpense: Expense = {
      id: generateId(),
      doctorId: 'demo-doctor-1',
      amount: data.amount,
      category: data.category,
      description: data.description || '',
      expenseDate: data.expenseDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expenses.push(newExpense);
    setData(STORAGE_KEYS.expenses, expenses);
    return newExpense;
  }

  async updateExpense(id: string, data: UpdateExpenseData): Promise<Expense> {
    const expenses = getData<Expense>(STORAGE_KEYS.expenses);
    const index = expenses.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Expense not found');
    expenses[index] = { ...expenses[index], ...data, updatedAt: new Date().toISOString() };
    setData(STORAGE_KEYS.expenses, expenses);
    return expenses[index];
  }

  async deleteExpense(id: string): Promise<void> {
    const expenses = getData<Expense>(STORAGE_KEYS.expenses);
    setData(STORAGE_KEYS.expenses, expenses.filter(e => e.id !== id));
  }

  // Current Patient
  async getCurrentPatient(): Promise<{ currentPatient: Patient | null }> {
    const id = localStorage.getItem(STORAGE_KEYS.currentPatient);
    if (!id) return { currentPatient: null };
    try {
      const patient = await this.getPatient(id);
      return { currentPatient: patient };
    } catch {
      return { currentPatient: null };
    }
  }

  async setCurrentPatient(patientId: string): Promise<{ currentPatient: Patient }> {
    localStorage.setItem(STORAGE_KEYS.currentPatient, patientId);
    const patient = await this.getPatient(patientId);
    return { currentPatient: patient };
  }

  async clearCurrentPatient(): Promise<{ currentPatient: null }> {
    localStorage.removeItem(STORAGE_KEYS.currentPatient);
    return { currentPatient: null };
  }

  // Lab Results
  async getLabResults(patientId: string): Promise<LabResult[]> {
    const results = getData<LabResult>(STORAGE_KEYS.labResults);
    return results.filter(r => r.patientId === patientId);
  }

  async createLabResult(data: CreateLabResultData): Promise<LabResult> {
    const results = getData<LabResult>(STORAGE_KEYS.labResults);
    const newResult: LabResult = {
      id: generateId(),
      patientId: data.patientId,
      doctorId: 'demo-doctor-1',
      category: data.category,
      testName: data.testName,
      resultValue: data.resultValue,
      unit: data.unit || null,
      referenceRange: data.referenceRange || null,
      isAbnormal: data.isAbnormal || false,
      testDate: data.testDate,
      notes: data.notes || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    results.push(newResult);
    setData(STORAGE_KEYS.labResults, results);
    return newResult;
  }

  async updateLabResult(id: string, data: UpdateLabResultData): Promise<LabResult> {
    const results = getData<LabResult>(STORAGE_KEYS.labResults);
    const index = results.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Lab result not found');
    results[index] = { ...results[index], ...data, updatedAt: new Date().toISOString() };
    setData(STORAGE_KEYS.labResults, results);
    return results[index];
  }

  async deleteLabResult(id: string): Promise<void> {
    const results = getData<LabResult>(STORAGE_KEYS.labResults);
    setData(STORAGE_KEYS.labResults, results.filter(r => r.id !== id));
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    return getData<Notification>(STORAGE_KEYS.notifications);
  }

  async getUnreadCount(): Promise<{ count: number }> {
    const notifications = getData<Notification>(STORAGE_KEYS.notifications);
    return { count: notifications.filter(n => !n.read).length };
  }

  async markNotificationAsRead(id: string): Promise<void> {
    const notifications = getData<Notification>(STORAGE_KEYS.notifications);
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications[index].read = true;
      setData(STORAGE_KEYS.notifications, notifications);
    }
  }

  async markAllNotificationsAsRead(): Promise<void> {
    const notifications = getData<Notification>(STORAGE_KEYS.notifications);
    notifications.forEach(n => n.read = true);
    setData(STORAGE_KEYS.notifications, notifications);
  }

  async deleteNotification(id: string): Promise<void> {
    const notifications = getData<Notification>(STORAGE_KEYS.notifications);
    setData(STORAGE_KEYS.notifications, notifications.filter(n => n.id !== id));
  }

  async deleteAllNotifications(): Promise<void> {
    setData(STORAGE_KEYS.notifications, []);
  }

  // Settings
  async getSettings(): Promise<Settings> {
    const settings = localStorage.getItem(STORAGE_KEYS.settings);
    return settings ? JSON.parse(settings) : {
      doctorId: 'demo-doctor-1',
      newVisitPrice: 200,
      followupVisitPrice: 100,
    };
  }

  async updateSettings(data: UpdateSettingsData): Promise<Settings> {
    const current = await this.getSettings();
    const updated = { ...current, ...data, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(updated));
    return updated;
  }

  // Analytics
  async getAnalytics(_startDate?: string, _endDate?: string): Promise<AnalyticsData> {
    const visits = getData<Visit>(STORAGE_KEYS.visits);
    const expenses = getData<Expense>(STORAGE_KEYS.expenses);

    const newVisits = visits.filter(v => v.visitType === 'new');
    const followupVisits = visits.filter(v => v.visitType === 'followup');
    const totalRevenue = visits.reduce((sum, v) => sum + (v.price || 0), 0);
    const newRevenue = newVisits.reduce((sum, v) => sum + (v.price || 0), 0);
    const followupRevenue = followupVisits.reduce((sum, v) => sum + (v.price || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const uniquePatients = new Set(visits.map(v => v.patientId)).size;

    return {
      totalVisits: visits.length,
      newVisits: newVisits.length,
      followupVisits: followupVisits.length,
      totalRevenue,
      newVisitRevenue: newRevenue,
      followupVisitRevenue: followupRevenue,
      uniquePatients,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      dailyBreakdown: [],
    };
  }

  // Queue
  async getQueue(date?: string): Promise<QueueEntry[]> {
    const today = date || new Date().toISOString().split('T')[0];
    const entries = getData<QueueEntry>(STORAGE_KEYS.queue);
    return entries
      .filter(e => e.queueDate === today)
      .sort((a, b) => a.position - b.position);
  }

  async addToQueue(data: { patientId: string }): Promise<QueueEntry> {
    const patients = getData<Patient>(STORAGE_KEYS.patients);
    const patient = patients.find(p => p.id === data.patientId);
    if (!patient) throw new Error('Patient not found');

    const today = new Date().toISOString().split('T')[0];
    const entries = getData<QueueEntry>(STORAGE_KEYS.queue);
    const todayEntries = entries.filter(e => e.queueDate === today);

    // Check duplicate
    if (todayEntries.find(e => e.patientId === data.patientId)) {
      throw new Error('Patient already in queue');
    }

    const maxPos = todayEntries.reduce((max, e) => Math.max(max, e.position), 0);
    const newEntry: QueueEntry = {
      id: generateId(),
      patientId: data.patientId,
      patientName: patient.name,
      patientPhone: patient.phone || '',
      position: maxPos + 1,
      status: 'waiting',
      addedAt: new Date().toISOString(),
      addedBy: 'demo-doctor-1',
      queueDate: today,
    };

    entries.push(newEntry);
    setData(STORAGE_KEYS.queue, entries);
    return newEntry;
  }

  async updateQueueEntry(id: string, data: UpdateQueueEntryData): Promise<QueueEntry> {
    const entries = getData<QueueEntry>(STORAGE_KEYS.queue);
    const index = entries.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Queue entry not found');

    if (data.status !== undefined) entries[index].status = data.status;
    if (data.position !== undefined) entries[index].position = data.position;

    setData(STORAGE_KEYS.queue, entries);
    return entries[index];
  }

  async removeFromQueue(id: string): Promise<void> {
    const entries = getData<QueueEntry>(STORAGE_KEYS.queue);
    setData(STORAGE_KEYS.queue, entries.filter(e => e.id !== id));
  }

  async reorderQueue(reorderEntries: { id: string; position: number }[]): Promise<void> {
    const entries = getData<QueueEntry>(STORAGE_KEYS.queue);
    for (const r of reorderEntries) {
      const entry = entries.find(e => e.id === r.id);
      if (entry) entry.position = r.position;
    }
    setData(STORAGE_KEYS.queue, entries);
  }

}

export const mockApi = new MockApiClient();
export default mockApi;
