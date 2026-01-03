-- Add invite_code_id to clients table to track which invite code was used
-- This allows us to check bypass_payment flag during onboarding

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS invite_code_id UUID REFERENCES invite_codes(id);

CREATE INDEX IF NOT EXISTS idx_clients_invite_code_id ON clients(invite_code_id);

COMMENT ON COLUMN clients.invite_code_id IS 'The invite code used during signup, allows checking bypass_payment flag';

