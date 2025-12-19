-- Add quickbooks_info column to clients table
-- Run this in Supabase SQL Editor

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS quickbooks_info JSONB;

-- Add comment for documentation
COMMENT ON COLUMN clients.quickbooks_info IS 'Stores QuickBooks connection information (company name, email, notes)';

