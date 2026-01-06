-- Create notifications table for in-app notification center
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_by_id UUID NOT NULL,
  created_by_name VARCHAR(255) NOT NULL,
  created_by_role VARCHAR(20) NOT NULL CHECK (created_by_role IN ('doctor', 'assistant')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_notifications_doctor_id ON notifications(doctor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_doctor_unread ON notifications(doctor_id, is_read) WHERE is_read = false;

-- Add comment
COMMENT ON TABLE notifications IS 'Stores in-app notifications for doctors and their assistants';
