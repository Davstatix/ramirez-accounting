-- Add engagement_letter to allowed document types in required_documents table
-- Run this in your Supabase SQL Editor

-- Drop the existing check constraint
ALTER TABLE required_documents 
DROP CONSTRAINT IF EXISTS required_documents_document_type_check;

-- Add the constraint back with engagement_letter included
ALTER TABLE required_documents 
ADD CONSTRAINT required_documents_document_type_check 
CHECK (document_type IN (
  'engagement_letter',
  'tax_id_ein',
  'tax_id_ssn',
  'bank_statement',
  'business_license',
  'articles_of_incorporation',
  'operating_agreement',
  'w9_form',
  'voided_check',
  'payroll_documents',
  'other'
));

