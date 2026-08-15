import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export let API_URL = 'http://192.168.1.24:3000/api';

export async function loadServerUrl() {
  const saved = await SecureStore.getItemAsync('serverUrl');
  if (saved) API_URL = saved;
}

export async function saveServerUrl(url: string) {
  const normalized = url.replace(/\/$/, '');
  API_URL = normalized.endsWith('/api') ? normalized : normalized + '/api';
  await SecureStore.setItemAsync('serverUrl', API_URL);
}

export async function login(email: string, password: string) {
  const res = await axios.post(`${API_URL}/auth/login`, { email, password }, { timeout: 15000 });
  return res.data as { token: string; user: any };
}

export function makeClient(token: string) {
  return axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` },
    timeout: 30000,
  });
}

export interface ApiPatient {
  id: string;
  fileNumber?: string;
  name: string;
  phone: string;
  age: number;
  gender: 'male' | 'female';
  medicalHistory: string;
  allergies: string[];
  createdAt: string;
}

export interface ApiVisit {
  id: string;
  patientId: string;
  visitDate: string;
  visitType: 'new' | 'followup';
  price: number;
  chiefComplaint: string;
  diagnosis: string;
  notes: string;
  vitals: string | null;
  labTestRequest: string | null;
  prescriptionMedicines: string | null;
  medicalChecklists: string | null;
}

export interface ApiLabResult {
  id: string;
  patientId: string;
  category: string;
  testName: string;
  resultValue: string;
  unit: string | null;
  referenceRange: string | null;
  isAbnormal: boolean | number;
  testDate: string;
  notes: string | null;
}
