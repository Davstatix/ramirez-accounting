-- ============================================================================
-- FIX USER DELETION ISSUE - Add CASCADE to profiles foreign key
-- ============================================================================
-- 
-- PROBLEM: The profiles table references auth.users(id) without CASCADE,
-- which prevents deleting users from the Supabase Auth dashboard.
--
-- SOLUTION: Update the foreign key constraint to allow CASCADE deletion.
-- This will allow auth.users to be deleted, and profiles will be
-- automatically deleted as well.
-- ============================================================================

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Step 2: Recreate the foreign key with CASCADE
ALTER TABLE profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================================================
-- VERIFICATION: Check the constraint was updated
-- ============================================================================
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
LEFT JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'profiles'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'users'
    AND ccu.table_schema = 'auth';

-- The delete_rule should show 'CASCADE' after running this script

