-- ============================================================================
-- FIND ORPHANED AUTH USERS - Users without client records
-- ============================================================================
-- 
-- This script helps you find auth users that don't have corresponding
-- client records. These are "orphaned" users that remain after deleting
-- clients from the clients table.
-- ============================================================================

-- Find all orphaned auth users (users with role='client' but no client record)
SELECT 
    u.id as user_id,
    u.email,
    u.created_at as user_created_at,
    p.role,
    p.created_at as profile_created_at,
    CASE 
        WHEN c.id IS NOT NULL THEN 'Has client record'
        ELSE 'ORPHANED - No client record'
    END as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN clients c ON u.id = c.user_id
WHERE p.role = 'client'  -- Only show clients, not admins
    AND c.id IS NULL      -- No client record exists
ORDER BY u.created_at DESC;

-- Count orphaned users
SELECT 
    COUNT(*) as orphaned_users_count,
    'Total orphaned auth users (no client records)' as description
FROM auth.users u
INNER JOIN profiles p ON u.id = p.id
LEFT JOIN clients c ON u.id = c.user_id
WHERE p.role = 'client'
    AND c.id IS NULL;

-- Show all client profiles (including orphaned ones)
SELECT 
    p.id as profile_id,
    p.email,
    p.role,
    CASE 
        WHEN c.id IS NOT NULL THEN 'Has client record'
        ELSE 'ORPHANED - No client record'
    END as status,
    p.created_at
FROM profiles p
LEFT JOIN clients c ON p.id = c.user_id
WHERE p.role = 'client'
ORDER BY p.created_at DESC;

