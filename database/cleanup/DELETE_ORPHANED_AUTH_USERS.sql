-- ============================================================================
-- DELETE ORPHANED AUTH USERS - Manual Deletion Script
-- ============================================================================
-- 
-- This script helps you identify and delete orphaned auth users
-- (users with role='client' but no client records).
--
-- IMPORTANT: You cannot directly delete from auth.users via SQL in Supabase.
-- This script provides the user IDs that you can then delete via:
-- 1. Supabase Dashboard > Authentication > Users (manual deletion)
-- 2. Supabase Admin API (if you have access)
-- 3. Your application's delete endpoint
-- ============================================================================

-- ============================================================================
-- STEP 1: Find all orphaned auth users
-- ============================================================================

-- List all orphaned users with their details
SELECT 
    u.id as user_id,
    u.email,
    u.created_at as user_created_at,
    p.role,
    p.created_at as profile_created_at,
    'ORPHANED - No client record' as status
FROM auth.users u
INNER JOIN profiles p ON u.id = p.id
LEFT JOIN clients c ON u.id = c.user_id
WHERE p.role = 'client'  -- Only show clients, not admins
    AND c.id IS NULL      -- No client record exists
ORDER BY u.created_at DESC;

-- ============================================================================
-- STEP 2: Get just the user IDs (for bulk operations)
-- ============================================================================

-- This query returns just the user IDs that need to be deleted
-- Copy these IDs to delete users manually or via API
SELECT 
    u.id as user_id,
    u.email
FROM auth.users u
INNER JOIN profiles p ON u.id = p.id
LEFT JOIN clients c ON u.id = c.user_id
WHERE p.role = 'client'
    AND c.id IS NULL
ORDER BY u.created_at DESC;

-- ============================================================================
-- STEP 3: Count orphaned users
-- ============================================================================

SELECT 
    COUNT(*) as orphaned_users_count,
    'Total orphaned auth users to delete' as description
FROM auth.users u
INNER JOIN profiles p ON u.id = p.id
LEFT JOIN clients c ON u.id = c.user_id
WHERE p.role = 'client'
    AND c.id IS NULL;

-- ============================================================================
-- STEP 4: Verify admins are NOT affected
-- ============================================================================

-- Make sure no admin users are in the orphaned list
SELECT 
    COUNT(*) as admin_count,
    'Admin users (should NOT be in orphaned list)' as description
FROM auth.users u
INNER JOIN profiles p ON u.id = p.id
WHERE p.role = 'admin'
    AND u.id NOT IN (
        SELECT user_id FROM clients WHERE user_id IS NOT NULL
    );

-- ============================================================================
-- HOW TO DELETE THESE USERS:
-- ============================================================================
--
-- OPTION 1: Supabase Dashboard (Easiest)
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Search for each email from the list above
-- 3. Click the three dots (...) next to each user
-- 4. Select "Delete user"
--
-- OPTION 2: Supabase Admin API (Bulk deletion)
-- Use the user IDs from Step 2 and call:
-- supabase.auth.admin.deleteUser(userId) for each ID
--
-- OPTION 3: Your Application API
-- Use POST /api/clients/delete with { userId: "user-id-here" }
-- for each user ID from Step 2
--
-- OPTION 4: SQL Function (if you have service role SQL access)
-- See the function below - uncomment and use if you have permissions
-- ============================================================================

-- ============================================================================
-- OPTIONAL: SQL Function to Delete Orphaned Users
-- ============================================================================
-- 
-- WARNING: This function requires SERVICE ROLE permissions.
-- Most Supabase projects don't allow direct SQL deletion from auth.users.
-- Try this only if you have service role SQL access.
-- ============================================================================

-- Uncomment the function below if you have service role SQL access:
/*
CREATE OR REPLACE FUNCTION delete_orphaned_auth_users()
RETURNS TABLE(deleted_count INTEGER, deleted_users JSONB) AS $$
DECLARE
    user_record RECORD;
    deleted_ids UUID[] := ARRAY[]::UUID[];
    user_info JSONB[] := ARRAY[]::JSONB[];
BEGIN
    -- Find all orphaned users
    FOR user_record IN
        SELECT u.id, u.email
        FROM auth.users u
        INNER JOIN profiles p ON u.id = p.id
        LEFT JOIN clients c ON u.id = c.user_id
        WHERE p.role = 'client'
            AND c.id IS NULL
    LOOP
        -- Delete the user (requires service role)
        DELETE FROM auth.users WHERE id = user_record.id;
        
        -- Track deleted user
        deleted_ids := array_append(deleted_ids, user_record.id);
        user_info := array_append(user_info, jsonb_build_object(
            'id', user_record.id,
            'email', user_record.email
        ));
    END LOOP;
    
    RETURN QUERY SELECT 
        array_length(deleted_ids, 1)::INTEGER as deleted_count,
        array_to_jsonb(user_info) as deleted_users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- To use the function (if it works):
-- SELECT * FROM delete_orphaned_auth_users();
*/

-- ============================================================================
-- VERIFICATION: After deletion, run this to confirm
-- ============================================================================

-- After deleting users, this should return 0
SELECT 
    COUNT(*) as remaining_orphaned_users,
    'Should be 0 after deletion' as description
FROM auth.users u
INNER JOIN profiles p ON u.id = p.id
LEFT JOIN clients c ON u.id = c.user_id
WHERE p.role = 'client'
    AND c.id IS NULL;

