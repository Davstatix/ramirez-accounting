-- Messaging System Enhancements
-- Adds threading and status tracking to messages
-- Run this in your Supabase SQL Editor

-- Add new columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_parent_id ON messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_urgent ON messages(is_urgent);

-- Function to automatically set thread_id for replies
CREATE OR REPLACE FUNCTION set_thread_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a reply (has parent_message_id), set thread_id to the root message
  IF NEW.parent_message_id IS NOT NULL THEN
    -- Find the root message (message with no parent or thread_id pointing to itself)
    WITH RECURSIVE thread_root AS (
      SELECT id, parent_message_id, thread_id
      FROM messages
      WHERE id = NEW.parent_message_id
      
      UNION ALL
      
      SELECT m.id, m.parent_message_id, m.thread_id
      FROM messages m
      INNER JOIN thread_root tr ON m.id = tr.parent_message_id
    )
    SELECT COALESCE(
      (SELECT id FROM messages WHERE id = NEW.parent_message_id AND thread_id IS NULL),
      (SELECT thread_id FROM messages WHERE id = NEW.parent_message_id),
      NEW.parent_message_id
    ) INTO NEW.thread_id;
    
    -- If still no thread_id, use parent as thread root
    IF NEW.thread_id IS NULL THEN
      NEW.thread_id := NEW.parent_message_id;
    END IF;
  ELSE
    -- If this is a new message (no parent), thread_id is itself
    NEW.thread_id := NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set thread_id before insert
DROP TRIGGER IF EXISTS set_thread_id_trigger ON messages;
CREATE TRIGGER set_thread_id_trigger
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION set_thread_id();

-- Update existing messages to set thread_id to themselves (for messages without parents)
UPDATE messages 
SET thread_id = id 
WHERE thread_id IS NULL AND parent_message_id IS NULL;

