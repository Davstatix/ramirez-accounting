-- ============================================================================
-- DELETE USERS PROPERLY - SQL Script for Supabase
-- ============================================================================
-- 
-- This script provides the correct order to delete users and their data.
-- 
-- IMPORTANT: Before using this, run FIX_USER_DELETION.sql to add CASCADE
-- to the profiles foreign key constraint. Otherwise, you'll get errors
-- when trying to delete from auth.users.
-- ============================================================================

-- ============================================================================
-- OPTION 1: Delete via Supabase Admin API (RECOMMENDED)
-- ============================================================================
-- 
-- The best way to delete users is through your application's API endpoint
-- at /api/clients/delete which uses the service role client.
-- 
-- OR use the Supabase Admin API directly:
-- supabase.auth.admin.deleteUser(userId)
--
-- After fixing the CASCADE constraint, this should work from the dashboard too.
-- ============================================================================

-- ============================================================================
-- OPTION 2: Delete via SQL (if you have proper permissions)
-- ============================================================================
-- 
-- WARNING: You typically cannot delete from auth.users directly via SQL
-- unless you have service role access. This is a security feature.
--
-- The proper order (if you have service role SQL access) would be:
-- 1. Delete from clients (cascades to related tables)
-- 2. Delete from profiles (now possible with CASCADE fix)
-- 3. Delete from auth.users (requires service role)
--
-- However, since auth.users deletion requires special permissions,
-- it's better to use the Admin API or Dashboard after fixing CASCADE.
-- ============================================================================

-- Preview: See which users would be affected
SELECT 
    u.id as user_id,
    u.email,
    p.role,
    CASE 
        WHEN c.id IS NOT NULL THEN 'Has client record'
        ELSE 'No client record'
    END as client_status,
    u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN clients c ON u.id = c.user_id
WHERE p.role = 'client'  -- Only show clients, not admins
ORDER BY u.created_at DESC;

-- ============================================================================
-- OPTION 3: Manual deletion order (if using SQL with service role)
-- ============================================================================
-- 
-- Uncomment these ONLY if you have service role SQL access:
-- 
-- Step 1: Delete clients (this cascades to documents, messages, reports, etc.)
-- DELETE FROM clients
-- WHERE user_id IN (
--     SELECT id FROM profiles WHERE role = 'client'
-- );
--
-- Step 2: Delete profiles (after CASCADE fix, this will work)
-- DELETE FROM profiles
-- WHERE role = 'client';
--
-- Step 3: Delete auth.users (requires service role, usually done via API)
-- DELETE FROM auth.users
-- WHERE id IN (
--     SELECT id FROM profiles WHERE role = 'client'
-- );
--
-- NOTE: Step 3 typically won't work from SQL editor - use Admin API instead.
-- ============================================================================

