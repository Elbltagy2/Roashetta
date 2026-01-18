-- Migration: Create visit attachments table
-- Created at: 2025-01-18

CREATE TABLE IF NOT EXISTS visit_attachments (
    id TEXT PRIMARY KEY,
    visit_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    data_url TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    uploader_type TEXT NOT NULL CHECK (uploader_type IN ('doctor', 'assistant')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
);

-- Index for faster lookups by visit
CREATE INDEX IF NOT EXISTS idx_visit_attachments_visit_id ON visit_attachments(visit_id);
