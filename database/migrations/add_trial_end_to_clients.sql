-- Add trial_end field to clients table
-- Tracks when a free trial expires

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_clients_trial_end ON clients(trial_end);

COMMENT ON COLUMN clients.trial_end IS 'When the free trial expires. If NULL, no trial or trial already ended.';

