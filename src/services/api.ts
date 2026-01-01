const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
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
  name: string;
  phone: string;
  age: number;
  gender: 'male' | 'female';
  nationalId: string;
  medicalHistory: string;
  allergies: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientData {
  name: string;
  phone: string;
  age: number;
  gender: 'male' | 'female';
  nationalId: string;
  medicalHistory: string;
  allergies: string[];
}

export interface Visit {
  id: string;
  patientId: string;
  doctorId: string;
  visitDate: string;
  chiefComplaint: string;
  chiefComplaintDrawing: string | null;
  diagnosis: string;
  diagnosisDrawing: string | null;
  notes: string;
  notesDrawing: string | null;
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
  chiefComplaint?: string;
  chiefComplaintDrawing?: string;
  diagnosis?: string;
  diagnosisDrawing?: string;
  notes?: string;
  notesDrawing?: string;
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

export const api = new ApiClient();
export default api;
