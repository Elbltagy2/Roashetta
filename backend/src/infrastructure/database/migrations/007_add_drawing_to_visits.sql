-- Migration: Add drawing columns to visits and remove prescription dependency
-- Created at: 2024-12-30

-- Add drawing columns to visits table for chief complaint, diagnosis, and notes
ALTER TABLE visits ADD COLUMN IF NOT EXISTS chief_complaint_drawing TEXT;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS diagnosis_drawing TEXT;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS notes_drawing TEXT;

-- Keep legacy drawing_data for backwards compatibility (can be removed later)
ALTER TABLE visits ADD COLUMN IF NOT EXISTS drawing_data TEXT;

-- Make chief_complaint nullable since we now use drawings
ALTER TABLE visits ALTER COLUMN chief_complaint DROP NOT NULL;

-- Drop prescription-related tables (optional - uncomment if you want to remove them)
-- DROP TABLE IF EXISTS medicines CASCADE;
-- DROP TABLE IF EXISTS prescriptions CASCADE;
