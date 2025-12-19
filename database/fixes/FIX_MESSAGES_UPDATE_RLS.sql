-- Fix Messages UPDATE RLS Policies
-- This allows admins to update messages (mark as read, change status)
-- Run this in your Supabase SQL Editor

-- First, ensure we have the is_admin function (from FIX_PROFILES_RLS.sql)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing UPDATE policies if they exist
DROP POLICY IF EXISTS "Admins can update all messages" ON messages;
DROP POLICY IF EXISTS "Clients can update their own messages" ON messages;

-- Create UPDATE policy for admins
CREATE POLICY "Admins can update all messages"
  ON messages FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Create UPDATE policy for clients (they can mark their own messages as read)
CREATE POLICY "Clients can update their own messages"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE id = messages.client_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE id = messages.client_id AND user_id = auth.uid()
    )
  );

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'messages'
ORDER BY policyname;

