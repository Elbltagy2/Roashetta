-- Migration: Add medical history and requested lab drawing fields to visits
-- Created at: 2025-01-18

-- Add medical history drawing columns
ALTER TABLE visits ADD COLUMN IF NOT EXISTS past_medical_history_drawing TEXT;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS hpi_drawing TEXT;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS drug_history_drawing TEXT;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS family_history_drawing TEXT;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS current_medication_drawing TEXT;

-- Add requested lab drawing column
ALTER TABLE visits ADD COLUMN IF NOT EXISTS requested_lab_drawing TEXT;
