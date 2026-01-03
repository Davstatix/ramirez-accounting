-- Add bypass_payment field to invite_codes table
-- When true, clients using this invite code can skip payment during onboarding

ALTER TABLE invite_codes
ADD COLUMN IF NOT EXISTS bypass_payment BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN invite_codes.bypass_payment IS 'If true, client can skip payment step during onboarding';

