-- Fix RLS Policy to Allow Clients to Update Their Own Onboarding Status
-- Run this in your Supabase SQL Editor

-- Add policy for clients to update their own onboarding status
CREATE POLICY "Clients can update their own onboarding status"
  ON clients FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Verify the policy was created
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'clients' AND cmd = 'UPDATE';
