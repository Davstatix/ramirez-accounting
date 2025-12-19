-- Fix RLS Policy to Allow Clients to Delete Their Own Documents
-- Run this in your Supabase SQL Editor

-- Ensure helper functions exist
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_client_owner(client_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_uuid UUID;
BEGIN
  user_uuid := auth.uid();
  IF user_uuid IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM clients
    WHERE id = client_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing DELETE policies if they exist
DROP POLICY IF EXISTS "Clients can delete their own documents" ON documents;
DROP POLICY IF EXISTS "Admins can delete documents" ON documents;

-- Create DELETE policy for clients
CREATE POLICY "Clients can delete their own documents"
  ON documents FOR DELETE
  USING (is_client_owner(client_id));

-- Create DELETE policy for admins
CREATE POLICY "Admins can delete documents"
  ON documents FOR DELETE
  USING (is_admin());

-- Verify the policies were created
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'documents' AND cmd = 'DELETE';

