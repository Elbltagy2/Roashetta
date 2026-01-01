-- Migration: Create patient_records table
-- Created at: 2024-12-28

CREATE TABLE IF NOT EXISTS patient_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL, -- URL to stored file (S3, local, etc.)
    file_size INTEGER,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX IF NOT EXISTS idx_patient_records_patient_id ON patient_records(patient_id);
