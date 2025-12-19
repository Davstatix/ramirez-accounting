-- Clear All Messages Data
-- WARNING: This will permanently delete ALL messages
-- Only run this if you want to start fresh with testing
-- Run this in your Supabase SQL Editor

-- Delete all messages
DELETE FROM messages;

-- Optional: Reset the sequence if you want (not necessary for UUIDs, but included for completeness)
-- Messages use UUIDs so sequences don't apply, but this is here for reference

-- Verify deletion
SELECT COUNT(*) as remaining_messages FROM messages;
-- Should return 0

