-- Migration: Add recommended_plan column to invite_codes table
-- Run this in your Supabase SQL editor

ALTER TABLE invite_codes 
ADD COLUMN IF NOT EXISTS recommended_plan TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN invite_codes.recommended_plan IS 'Recommended subscription plan ID (starter, growth, or professional) discussed during discovery call';

