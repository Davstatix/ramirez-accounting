-- ============================================================================
-- DELETE ALL CLIENTS (BUT NOT ADMINS) - Supabase SQL Script
-- ============================================================================
-- 
-- This script will:
-- 1. Delete all client records from the 'clients' table where the user's 
--    profile role is 'client' (not 'admin')
-- 2. Due to CASCADE constraints, this will also automatically delete:
--    - All documents for those clients
--    - All messages for those clients
--    - All reports for those clients
--    - All required_documents for those clients
--    - All quickbooks_connections for those clients
-- 3. Optionally delete auth.users entries and profiles for clients
--
-- IMPORTANT: This is a destructive operation. Review the preview queries
-- below before running the actual DELETE statements.
-- ============================================================================

-- ============================================================================
-- STEP 1: PREVIEW - See what will be deleted
-- ============================================================================

-- Preview: Count clients that will be deleted (non-admin clients)
SELECT 
    COUNT(*) as clients_to_delete,
    'Total clients (non-admin) that will be deleted' as description
FROM clients c
INNER JOIN profiles p ON c.user_id = p.id
WHERE p.role = 'client';

-- Preview: List all clients that will be deleted
SELECT 
    c.id as client_id,
    c.name,
    c.email,
    c.user_id,
    p.role,
    c.created_at
FROM clients c
INNER JOIN profiles p ON c.user_id = p.id
WHERE p.role = 'client'
ORDER BY c.created_at DESC;

-- Preview: Count related records that will be cascade deleted
SELECT 
    'documents' as table_name,
    COUNT(*) as records_to_delete
FROM documents d
INNER JOIN clients c ON d.client_id = c.id
INNER JOIN profiles p ON c.user_id = p.id
WHERE p.role = 'client'
UNION ALL
SELECT 
    'messages' as table_name,
    COUNT(*) as records_to_delete
FROM messages m
INNER JOIN clients c ON m.client_id = c.id
INNER JOIN profiles p ON c.user_id = p.id
WHERE p.role = 'client'
UNION ALL
SELECT 
    'reports' as table_name,
    COUNT(*) as records_to_delete
FROM reports r
INNER JOIN clients c ON r.client_id = c.id
INNER JOIN profiles p ON c.user_id = p.id
WHERE p.role = 'client'
UNION ALL
SELECT 
    'required_documents' as table_name,
    COUNT(*) as records_to_delete
FROM required_documents rd
INNER JOIN clients c ON rd.client_id = c.id
INNER JOIN profiles p ON c.user_id = p.id
WHERE p.role = 'client'
UNION ALL
SELECT 
    'quickbooks_connections' as table_name,
    COUNT(*) as records_to_delete
FROM quickbooks_connections qb
INNER JOIN clients c ON qb.client_id = c.id
INNER JOIN profiles p ON c.user_id = p.id
WHERE p.role = 'client';

-- Preview: Verify admins are NOT affected
-- Check all admin profiles (admins may not have client records)
SELECT 
    COUNT(*) as admin_profiles_count,
    'Admin profiles (these will NOT be deleted)' as description
FROM profiles
WHERE role = 'admin';

-- Also check if any admins have client records (they shouldn't, but just in case)
SELECT 
    COUNT(*) as admin_clients_count,
    'Admin users with client records (these will NOT be deleted)' as description
FROM clients c
INNER JOIN profiles p ON c.user_id = p.id
WHERE p.role = 'admin';

-- ============================================================================
-- STEP 2: ACTUAL DELETION - Delete all clients (non-admin only)
-- ============================================================================
-- 
-- WARNING: Uncomment the DELETE statement below only after reviewing
-- the preview queries above and confirming the results are correct.
-- ============================================================================

-- Delete all clients where the user's profile role is 'client'
-- This will CASCADE delete all related records automatically
DELETE FROM clients
WHERE user_id IN (
    SELECT id 
    FROM profiles 
    WHERE role = 'client'
);

-- ============================================================================
-- STEP 3: OPTIONAL - Delete auth.users and profiles for deleted clients
-- ============================================================================
-- 
-- IMPORTANT: After deleting clients, you may have "orphaned" auth users
-- (users in auth.users that no longer have client records).
-- 
-- To find and delete orphaned users:
-- 1. Run FIND_ORPHANED_AUTH_USERS.sql to see which users are orphaned
-- 2. Use the API endpoint: POST /api/clients/delete-orphaned with { deleteAll: true }
--    OR delete them manually from Supabase Dashboard > Authentication > Users
-- 
-- NOTE: Deleting auth users will permanently remove user accounts from Supabase Auth.
-- Only do this if you're sure you want to completely remove these users.
-- ============================================================================

-- Option A: Delete profiles for clients (profiles with role='client' that don't have a client record)
-- DELETE FROM profiles
-- WHERE role = 'client'
-- AND id NOT IN (SELECT user_id FROM clients WHERE user_id IS NOT NULL);

-- Option B: Delete auth.users entries (requires service role or admin access)
-- This must be done via Supabase Dashboard or Admin API, not SQL
-- The auth.users table is in the auth schema and requires special permissions
-- 
-- To delete auth users, you would need to:
-- 1. Use Supabase Dashboard > Authentication > Users
-- 2. Or use the Admin API: supabase.auth.admin.deleteUser(user_id)
-- 3. Or use the API endpoint: POST /api/clients/delete-orphaned with { deleteAll: true }

-- ============================================================================
-- STEP 4: VERIFICATION - Confirm deletion
-- ============================================================================

-- Verify: Should return 0 (or only admin clients if any exist)
SELECT 
    COUNT(*) as remaining_client_clients,
    'Remaining clients with role=client (should be 0)' as description
FROM clients c
INNER JOIN profiles p ON c.user_id = p.id
WHERE p.role = 'client';

-- Verify: Count remaining clients (should only be admins if any)
SELECT 
    COUNT(*) as total_remaining_clients,
    'Total remaining clients (should only be admins)' as description
FROM clients;

-- Verify: Admins are still intact
SELECT 
    COUNT(*) as admin_count,
    'Admin profiles (should remain unchanged)' as description
FROM profiles
WHERE role = 'admin';

