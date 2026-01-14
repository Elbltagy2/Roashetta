// Auth
export * from './auth/RegisterDoctor';
export * from './auth/LoginDoctor';

// Patient
export * from './patient/CreatePatient';
export * from './patient/GetPatients';
export * from './patient/GetPatientById';
export * from './patient/UpdatePatient';
export * from './patient/DeletePatient';
export * from './patient/SearchPatients';

// Visit
export * from './visit/CreateVisit';
export * from './visit/GetVisitsByPatient';
export * from './visit/GetVisitById';

// Patient Record
export * from './patient-record/UploadPatientRecord';
export * from './patient-record/GetPatientRecords';
export * from './patient-record/DeletePatientRecord';
