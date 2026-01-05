-- Migration: Add current_patient_id to doctors table
-- Created at: 2025-01-05

-- Add current_patient_id column to track which patient is currently being seen
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS current_patient_id UUID REFERENCES patients(id) ON DELETE SET NULL;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_doctors_current_patient ON doctors(current_patient_id);
