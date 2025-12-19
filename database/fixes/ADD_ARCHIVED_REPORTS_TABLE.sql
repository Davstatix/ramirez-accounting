-- Add archived_reports table for storing reports of archived clients
CREATE TABLE IF NOT EXISTS archived_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  uploaded_by UUID
);

-- Add subscription fields to archived_clients if not exists
ALTER TABLE archived_clients
ADD COLUMN IF NOT EXISTS subscription_plan TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT,
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_cancelled_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS
ALTER TABLE archived_reports ENABLE ROW LEVEL SECURITY;

-- Admins can manage archived reports
CREATE POLICY "Admins can manage archived reports"
  ON archived_reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

