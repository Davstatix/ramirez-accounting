-- Update required_documents to match new document types
-- Run this in Supabase SQL Editor

-- First, update existing required_documents to set is_required = true for all 4 document types
UPDATE required_documents
SET is_required = true
WHERE document_type IN ('tax_id_ein', 'tax_id_ssn', 'bank_statement', 'business_license');

-- Remove old document types that are no longer needed (w9_form, voided_check)
DELETE FROM required_documents
WHERE document_type IN ('w9_form', 'voided_check');

-- Add missing required_documents entries for existing clients
-- This ensures all clients have all 4 required document types
INSERT INTO required_documents (client_id, document_type, is_required, status)
SELECT c.id, dt.type, true, 'pending'
FROM clients c
CROSS JOIN (
  VALUES 
    ('tax_id_ein'),
    ('tax_id_ssn'),
    ('bank_statement'),
    ('business_license')
) AS dt(type)
WHERE NOT EXISTS (
  SELECT 1 FROM required_documents rd 
  WHERE rd.client_id = c.id AND rd.document_type = dt.type
);

