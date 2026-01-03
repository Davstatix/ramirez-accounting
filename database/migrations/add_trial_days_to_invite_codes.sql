-- Add trial_days field to invite_codes table
-- When bypass_payment is true and trial_days is set, client gets a time-limited free trial
-- If trial_days is null, client gets permanent free access

ALTER TABLE invite_codes
ADD COLUMN IF NOT EXISTS trial_days INTEGER;

COMMENT ON COLUMN invite_codes.trial_days IS 'Number of days for free trial. If NULL and bypass_payment is true, account is permanently free.';

