type Entry<V> = { value: V; expiresAt: number };

export class MemoryCache {
  private store = new Map<string, Entry<unknown>>();
  private defaultTtlMs: number;

  constructor(defaultTtlMs = 60_000) {
    this.defaultTtlMs = defaultTtlMs;
  }

  get<V>(key: string): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as V;
  }

  set<V>(key: string, value: V, ttlMs?: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  deletePrefix(prefix: string): void {
    for (const key of Array.from(this.store.keys())) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

export const cache = new MemoryCache(60_000);

export const cacheKeys = {
  patientsAll: (doctorId: string) => `patients:${doctorId}:all`,
  patientsPaginated: (
    doctorId: string,
    page: number,
    limit: number,
    search: string,
    gender: string
  ) => `patients:${doctorId}:p=${page}:l=${limit}:s=${search}:g=${gender}`,
  patientsListPrefix: (doctorId: string) => `patients:${doctorId}:`,
  patient: (doctorId: string, id: string) => `patient:${doctorId}:${id}`,
  patientByDoctorPrefix: (doctorId: string) => `patient:${doctorId}:`,
  currentPatient: (doctorId: string) => `currentPatient:${doctorId}`,
  settings: (doctorId: string) => `settings:${doctorId}`,
};

export function invalidatePatientCaches(doctorId: string, patientId?: string) {
  cache.deletePrefix(cacheKeys.patientsListPrefix(doctorId));
  cache.delete(cacheKeys.currentPatient(doctorId));
  if (patientId) {
    cache.delete(cacheKeys.patient(doctorId, patientId));
  } else {
    cache.deletePrefix(cacheKeys.patientByDoctorPrefix(doctorId));
  }
}
