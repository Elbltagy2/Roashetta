import { Notification } from '../types/notification';
import { mockApi } from './mockApi';

// Check if we're in demo mode (for Vercel deployment)
const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// Use relative URL in production (when served from same origin), absolute in development
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api');

// Event for unauthorized (token expired) - components can listen to this
type AuthErrorCallback = () => void;

class ApiClient {
  private token: string | null = null;
  private onAuthError: AuthErrorCallback | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  // Set callback for when token expires (401 response)
  setAuthErrorHandler(callback: AuthErrorCallback | null) {
    this.onAuthError = callback;
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Handle 401 Unauthorized (token expired or invalid)
      if (response.status === 401) {
        // Clear token and notify listeners
        this.setToken(null);
        if (this.onAuthError) {
          this.onAuthError();
        }
        throw new Error('Session expired. Please login again.');
      }

      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth
  async register(data: {
    email: string;
    password: string;
    name: string;
    specialization?: string;
    phone?: string;
    clinicName?: string;
    clinicAddress?: string;
  }) {
    return this.request<{ message: string; doctor: { id: string; email: string; name: string } }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify(data) }
    );
  }

  async login(email: string, password: string) {
    const result = await this.request<{
      token: string;
      user: User;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(result.token);
    return result;
  }

  logout() {
    this.setToken(null);
  }

  // Assistants (Doctor only)
  async getAssistants() {
    return this.request<Assistant[]>('/assistants');
  }

  async createAssistant(data: CreateAssistantData) {
    return this.request<Assistant>('/assistants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAssistant(id: string, data: UpdateAssistantData) {
    return this.request<Assistant>(`/assistants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAssistant(id: string) {
    return this.request<void>(`/assistants/${id}`, { method: 'DELETE' });
  }

  // Patients
  async getPatients() {
    return this.request<Patient[]>('/patients');
  }

  async getPatientsPaginated(params: {
    page: number;
    limit: number;
    search?: string;
    gender?: 'male' | 'female';
  }) {
    const query = new URLSearchParams();
    query.set('page', String(params.page));
    query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.gender) query.set('gender', params.gender);
    return this.request<{
      data: Patient[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/patients?${query.toString()}`);
  }

  async getPatient(id: string) {
    return this.request<Patient>(`/patients/${id}`);
  }

  async createPatient(data: CreatePatientData) {
    return this.request<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePatient(id: string, data: Partial<CreatePatientData>) {
    return this.request<Patient>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePatient(id: string) {
    return this.request<void>(`/patients/${id}`, { method: 'DELETE' });
  }

  async searchPatients(query: string) {
    return this.request<Patient[]>(`/patients/search?q=${encodeURIComponent(query)}`);
  }

  // Visits
  async getVisitsByPatient(patientId: string) {
    return this.request<Visit[]>(`/visits/patient/${patientId}`);
  }

  async getVisit(id: string) {
    return this.request<Visit>(`/visits/${id}`);
  }

  async createVisit(data: CreateVisitData) {
    return this.request<Visit>('/visits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVisitPrice(visitId: string, price: number) {
    return this.request<Visit>(`/visits/${visitId}/price`, {
      method: 'PUT',
      body: JSON.stringify({ price }),
    });
  }

  async updateVisit(visitId: string, data: UpdateVisitData) {
    return this.request<Visit>(`/visits/${visitId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Patient Records
  async getPatientRecords(patientId: string) {
    return this.request<PatientRecord[]>(`/patient-records/patient/${patientId}`);
  }

  async uploadPatientRecord(data: CreatePatientRecordData) {
    return this.request<PatientRecord>('/patient-records', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deletePatientRecord(id: string) {
    return this.request<void>(`/patient-records/${id}`, { method: 'DELETE' });
  }

  // Previous Investigations
  async getPreviousInvestigations(patientId: string) {
    return this.request<PreviousInvestigation[]>(`/previous-investigations/patient/${patientId}`);
  }

  async uploadPreviousInvestigation(data: CreatePreviousInvestigationData) {
    return this.request<PreviousInvestigation>('/previous-investigations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deletePreviousInvestigation(id: string) {
    return this.request<void>(`/previous-investigations/${id}`, { method: 'DELETE' });
  }

  // Visit Attachments
  async getVisitAttachments(visitId: string) {
    return this.request<VisitAttachment[]>(`/visits/${visitId}/attachments`);
  }

  async uploadVisitAttachment(visitId: string, data: CreateVisitAttachmentData) {
    return this.request<VisitAttachment>(`/visits/${visitId}/attachments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteVisitAttachment(id: string) {
    return this.request<void>(`/visits/attachments/${id}`, { method: 'DELETE' });
  }

  // Expenses
  async getExpenses(startDate?: string, endDate?: string) {
    let url = '/expenses';
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return this.request<Expense[]>(url);
  }

  async createExpense(data: CreateExpenseData) {
    return this.request<Expense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateExpense(id: string, data: UpdateExpenseData) {
    return this.request<Expense>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteExpense(id: string) {
    return this.request<void>(`/expenses/${id}`, { method: 'DELETE' });
  }

  // Current Patient
  async getCurrentPatient() {
    return this.request<{ currentPatient: Patient | null }>('/current-patient');
  }

  async setCurrentPatient(patientId: string) {
    return this.request<{ currentPatient: Patient }>(`/current-patient/${patientId}`, {
      method: 'POST',
    });
  }

  async clearCurrentPatient() {
    return this.request<{ currentPatient: null }>('/current-patient', {
      method: 'DELETE',
    });
  }

  // Lab Results
  async getLabResults(patientId: string) {
    return this.request<LabResult[]>(`/lab-results/patient/${patientId}`);
  }

  async createLabResult(data: CreateLabResultData) {
    return this.request<LabResult>('/lab-results', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLabResult(id: string, data: UpdateLabResultData) {
    return this.request<LabResult>(`/lab-results/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLabResult(id: string) {
    return this.request<void>(`/lab-results/${id}`, { method: 'DELETE' });
  }

  // Notifications
  async getNotifications() {
    return this.request<Notification[]>('/notifications');
  }

  async getUnreadCount() {
    return this.request<{ count: number }>('/notifications/unread');
  }

  async markNotificationAsRead(id: string) {
    return this.request<void>(`/notifications/${id}/read`, { method: 'PUT' });
  }

  async markAllNotificationsAsRead() {
    return this.request<void>('/notifications/read-all', { method: 'PUT' });
  }

  async deleteNotification(id: string) {
    return this.request<void>(`/notifications/${id}`, { method: 'DELETE' });
  }

  async deleteAllNotifications() {
    return this.request<void>('/notifications', { method: 'DELETE' });
  }

  // Settings
  async getSettings() {
    return this.request<Settings>('/settings');
  }

  async updateSettings(data: UpdateSettingsData) {
    return this.request<Settings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Analytics
  async getAnalytics(startDate?: string, endDate?: string) {
    let url = '/analytics';
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;
    return this.request<AnalyticsData>(url);
  }

  // Queue
  async getQueue(date?: string) {
    let url = '/queue';
    if (date) url += `?date=${encodeURIComponent(date)}`;
    return this.request<QueueEntry[]>(url);
  }

  async addToQueue(data: { patientId: string }) {
    return this.request<QueueEntry>('/queue', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateQueueEntry(id: string, data: UpdateQueueEntryData) {
    return this.request<QueueEntry>(`/queue/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async removeFromQueue(id: string) {
    return this.request<void>(`/queue/${id}`, { method: 'DELETE' });
  }

  async reorderQueue(entries: { id: string; position: number }[]) {
    return this.request<void>('/queue/reorder', {
      method: 'PUT',
      body: JSON.stringify({ entries }),
    });
  }

  // Scanner
  async discoverScanners() {
    return this.request<DiscoveredScanner[]>('/scanner/discover');
  }

  async setDefaultScanner(data: { url: string; name?: string }) {
    return this.request<Settings>('/scanner/default', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async quickScan(visitId: string, options?: ScanOptions) {
    return this.request<{ attachment: VisitAttachment; scanner: { url: string; name: string } }>(
      `/scanner/quick-scan/${visitId}`,
      {
        method: 'POST',
        body: JSON.stringify(options ?? {}),
      },
    );
  }

}

// Types
export type UserRole = 'doctor' | 'assistant';

export interface AssistantPermissions {
  canCreatePatients: boolean;
  canEditPatients: boolean;
  canDeletePatients: boolean;
  canCreateVisits: boolean;
  canEditVisits: boolean;
  canDeleteVisits: boolean;
  canViewPrescriptions: boolean;
  canCreatePrescriptions: boolean;
  canManageRecords: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  // Doctor fields
  specialization?: string;
  clinicName?: string;
  // Assistant fields
  doctorId?: string;
  permissions?: AssistantPermissions;
}

export interface Assistant {
  id: string;
  email: string;
  name: string;
  phone: string;
  isActive: boolean;
  permissions: AssistantPermissions;
  createdAt: string;
}

export interface CreateAssistantData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  permissions?: Partial<AssistantPermissions>;
}

export interface UpdateAssistantData {
  name?: string;
  phone?: string;
  isActive?: boolean;
  permissions?: Partial<AssistantPermissions>;
}

export interface Patient {
  id: string;
  doctorId: string;
  fileNumber: string;
  name: string;
  phone: string;
  age: number;
  gender: 'male' | 'female';
  medicalHistory: string;
  allergies: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientData {
  fileNumber?: string;
  name: string;
  phone: string;
  age: number;
  gender: 'male' | 'female';
  medicalHistory: string;
  allergies: string[];
}

export type VisitType = 'new' | 'followup';

export interface Visit {
  id: string;
  patientId: string;
  doctorId: string;
  visitDate: string;
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
  // Medical Checklists (JSON string)
  medicalChecklists: string | null;
  vitals: {
    bloodPressure: string;
    temperature: number;
    weight: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateVisitData {
  patientId: string;
  visitType?: VisitType;
  price?: number;
  chiefComplaint?: string;
  chiefComplaintDrawing?: string;
  diagnosis?: string;
  diagnosisDrawing?: string;
  notes?: string;
  notesDrawing?: string;
  notesDrawing2?: string;
  notesDrawing3?: string;
  // Medical History Fields
  pastMedicalHistoryDrawing?: string;
  hpiDrawing?: string;
  drugHistoryDrawing?: string;
  familyHistoryDrawing?: string;
  currentMedicationDrawing?: string;
  // Radiology (3 pages)
  radiologyDrawing?: string;
  radiologyDrawing2?: string;
  radiologyDrawing3?: string;
  // Lab Test Request (JSON string)
  labTestRequest?: string;
  // Radiology Request (JSON string)
  radiologyRequest?: string;
  // Medical Checklists (JSON string)
  medicalChecklists?: string;
  vitals?: {
    bloodPressure?: string;
    temperature?: number;
    weight?: number;
  };
}

export interface UpdateVisitData {
  visitType?: VisitType;
  price?: number;
  chiefComplaint?: string;
  chiefComplaintDrawing?: string | null;
  diagnosis?: string;
  diagnosisDrawing?: string | null;
  notes?: string;
  notesDrawing?: string | null;
  notesDrawing2?: string | null;
  notesDrawing3?: string | null;
  pastMedicalHistoryDrawing?: string | null;
  hpiDrawing?: string | null;
  drugHistoryDrawing?: string | null;
  familyHistoryDrawing?: string | null;
  currentMedicationDrawing?: string | null;
  radiologyDrawing?: string | null;
  radiologyDrawing2?: string | null;
  radiologyDrawing3?: string | null;
  labTestRequest?: string | null;
  radiologyRequest?: string | null;
  medicalChecklists?: string | null;
  vitals?: {
    bloodPressure?: string;
    temperature?: number;
    weight?: number;
  };
}

export interface PatientRecord {
  id: string;
  patientId: string;
  name: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
}

export interface CreatePatientRecordData {
  patientId: string;
  name: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
}

export interface PreviousInvestigation {
  id: string;
  patientId: string;
  name: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
}

export interface CreatePreviousInvestigationData {
  patientId: string;
  name: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
}

export interface VisitAttachment {
  id: string;
  visitId: string;
  name: string;
  type: string;
  dataUrl: string;
  uploadedBy: string;
  uploaderType: 'doctor' | 'assistant';
  createdAt: string;
}

export interface CreateVisitAttachmentData {
  name: string;
  type: string;
  dataUrl: string;
}

export type ExpenseCategory = 'rent' | 'utilities' | 'supplies' | 'equipment' | 'maintenance' | 'other';

export interface Expense {
  id: string;
  doctorId: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  expenseDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseData {
  amount: number;
  category: ExpenseCategory;
  description?: string;
  expenseDate: string;
}

export interface UpdateExpenseData {
  amount?: number;
  category?: ExpenseCategory;
  description?: string;
  expenseDate?: string;
}

export type LabCategory = 'cbc' | 'sugar' | 'liver' | 'kidney' | 'lipids' | 'thyroid' | 'urine';

export interface LabResult {
  id: string;
  patientId: string;
  doctorId: string;
  category: LabCategory;
  testName: string;
  resultValue: string;
  unit: string | null;
  referenceRange: string | null;
  isAbnormal: boolean;
  testDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLabResultData {
  patientId: string;
  category: LabCategory;
  testName: string;
  resultValue: string;
  unit?: string;
  referenceRange?: string;
  isAbnormal?: boolean;
  testDate: string;
  notes?: string;
}

export interface UpdateLabResultData {
  category?: LabCategory;
  testName?: string;
  resultValue?: string;
  unit?: string;
  referenceRange?: string;
  isAbnormal?: boolean;
  testDate?: string;
  notes?: string;
}

// Settings
export interface Settings {
  id?: string;
  doctorId: string;
  newVisitPrice: number;
  followupVisitPrice: number;
  lastScannerUrl?: string;
  lastScannerName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateSettingsData {
  newVisitPrice?: number;
  followupVisitPrice?: number;
  lastScannerUrl?: string;
  lastScannerName?: string;
}

// Scanner
export interface DiscoveredScanner {
  name: string;
  host: string;
  port: number;
  url: string;
  secure: boolean;
}

export interface ScanOptions {
  url?: string;
  resolution?: number;
  colorMode?: 'RGB24' | 'Grayscale8' | 'BlackAndWhite1';
  source?: 'Platen' | 'Feeder';
  format?: 'image/jpeg' | 'application/pdf';
}

// Analytics
export interface AnalyticsData {
  totalVisits: number;
  newVisits: number;
  followupVisits: number;
  totalRevenue: number;
  newVisitRevenue: number;
  followupVisitRevenue: number;
  uniquePatients: number;
  totalExpenses: number;
  netProfit: number;
  dailyBreakdown: {
    date: string;
    totalVisits: number;
    newVisits: number;
    followupVisits: number;
    revenue: number;
  }[];
}

// Queue
export type QueueStatus = 'waiting' | 'in-progress' | 'done';

export interface QueueEntry {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  position: number;
  status: QueueStatus;
  addedAt: string;
  addedBy: string;
  queueDate: string;
}

export interface UpdateQueueEntryData {
  status?: QueueStatus;
  position?: number;
}

// Use mock API in demo mode, real API otherwise
const apiClient = new ApiClient();
export const api = IS_DEMO_MODE ? mockApi : apiClient;
export default api;
