-- Onboarding System Database Schema
-- Run this in your Supabase SQL Editor

-- Add onboarding status to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'pending' 
CHECK (onboarding_status IN ('pending', 'in_progress', 'completed', 'requires_update'));

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Required documents tracking table
CREATE TABLE IF NOT EXISTS required_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN (
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
  )),
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  is_required BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'uploaded', 'verified', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(client_id, document_type)
);

-- QuickBooks integration table
CREATE TABLE IF NOT EXISTS quickbooks_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL UNIQUE,
  company_id TEXT, -- QuickBooks company ID
  access_token TEXT, -- Encrypted/stored securely
  refresh_token TEXT, -- Encrypted/stored securely
  realm_id TEXT, -- QuickBooks realm ID
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add document category to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS document_category TEXT CHECK (document_category IN (
  'onboarding',
  'monthly',
  'year_end',
  'ad_hoc',
  'other'
));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_required_documents_client_id ON required_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_required_documents_status ON required_documents(status);
CREATE INDEX IF NOT EXISTS idx_quickbooks_connections_client_id ON quickbooks_connections(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_onboarding_status ON clients(onboarding_status);

-- Row Level Security for new tables
ALTER TABLE required_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE quickbooks_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for required_documents
CREATE POLICY "Clients can view their own required documents"
  ON required_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE id = required_documents.client_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all required documents"
  ON required_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Clients can insert their own required documents"
  ON required_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE id = required_documents.client_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can update their own required documents"
  ON required_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE id = required_documents.client_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all required documents"
  ON required_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for quickbooks_connections
CREATE POLICY "Clients can view their own QuickBooks connection"
  ON quickbooks_connections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE id = quickbooks_connections.client_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all QuickBooks connections"
  ON quickbooks_connections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Clients can insert their own QuickBooks connection"
  ON quickbooks_connections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE id = quickbooks_connections.client_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can update their own QuickBooks connection"
  ON quickbooks_connections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE id = quickbooks_connections.client_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all QuickBooks connections"
  ON quickbooks_connections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to check if onboarding is complete
CREATE OR REPLACE FUNCTION check_onboarding_complete(client_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  required_count INTEGER;
  uploaded_count INTEGER;
BEGIN
  -- Count required documents
  SELECT COUNT(*) INTO required_count
  FROM required_documents
  WHERE client_id = client_uuid AND is_required = true;
  
  -- Count uploaded and verified documents
  SELECT COUNT(*) INTO uploaded_count
  FROM required_documents
  WHERE client_id = client_uuid 
    AND is_required = true 
    AND status IN ('uploaded', 'verified');
  
  -- Return true if all required documents are uploaded
  RETURN required_count > 0 AND uploaded_count = required_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

