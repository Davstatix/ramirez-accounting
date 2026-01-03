-- Add engagement_letter_path to invite_codes table
-- Run this in Supabase SQL Editor

ALTER TABLE invite_codes 
ADD COLUMN IF NOT EXISTS engagement_letter_path TEXT;

-- Add comment
COMMENT ON COLUMN invite_codes.engagement_letter_path IS 'Path to the engagement letter PDF file in Supabase Storage';

