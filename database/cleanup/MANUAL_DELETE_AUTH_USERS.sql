-- ============================================================================
-- DELETE CLIENT USERS - Script for Supabase SQL Editor
-- ============================================================================
-- 
-- This script deletes client profiles (which unblocks deletion) and lists
-- ALL CLIENT users (excluding admins) so you can manually delete them.
-- 
-- STEP 1: Delete client profiles (removes foreign key blocking deletion)
-- STEP 2: List client users to delete
-- STEP 3: Go to Supabase Dashboard > Authentication > Users and delete them
-- ============================================================================

-- ============================================================================
-- STEP 1: Delete all client profiles
-- ============================================================================
-- This removes the foreign key constraint blocking deletion from auth.users

DELETE FROM profiles
WHERE role = 'client';

-- ============================================================================
-- STEP 2: List all client users to delete (excludes admin users)
-- ============================================================================
-- After running Step 1, use this list to find and delete users in the
-- Supabase Auth dashboard by searching for their email addresses.

SELECT 
    u.id as user_id,
    u.email,
    u.created_at
FROM auth.users u
WHERE u.id NOT IN (
    SELECT id FROM profiles WHERE role = 'admin'
)
ORDER BY u.created_at DESC;
