-- Update documents table to allow 'rejected' status
-- Run this in Supabase SQL editor

ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;

ALTER TABLE documents ADD CONSTRAINT documents_status_check 
  CHECK (status IN ('pending', 'processed', 'archived', 'rejected'));

