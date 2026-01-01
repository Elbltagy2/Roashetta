-- Migration: Create assistants table
-- Created at: 2024-12-28

CREATE TABLE IF NOT EXISTS assistants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    -- Permissions (Limited access by default)
    can_create_patients BOOLEAN DEFAULT true,
    can_edit_patients BOOLEAN DEFAULT true,
    can_delete_patients BOOLEAN DEFAULT false,
    can_create_visits BOOLEAN DEFAULT true,
    can_edit_visits BOOLEAN DEFAULT true,
    can_delete_visits BOOLEAN DEFAULT false,
    can_view_prescriptions BOOLEAN DEFAULT false,
    can_create_prescriptions BOOLEAN DEFAULT false,
    can_manage_records BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assistants_doctor_id ON assistants(doctor_id);
CREATE INDEX IF NOT EXISTS idx_assistants_email ON assistants(email);
