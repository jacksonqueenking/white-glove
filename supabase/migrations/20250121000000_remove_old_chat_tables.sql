-- Remove Old Chat Tables Migration
--
-- The old `chats` and `messages` tables are now superseded by the ChatKit implementation:
-- - chatkit_threads (replaces chats)
-- - chatkit_thread_items (replaces chats.messages JSONB)
-- - chatkit_attachments (new feature)
--
-- This migration removes the old tables since they are no longer used.

-- ============================================================================
-- DROP OLD CHAT TABLES
-- ============================================================================

-- Drop the old chats table
-- This table stored AI chat history in a JSONB messages array
-- Now replaced by chatkit_threads and chatkit_thread_items
DROP TABLE IF EXISTS chats CASCADE;

-- Note: The `messages` table (human-to-human messaging) is still used and NOT dropped
-- It serves a different purpose than ChatKit (inter-user communication, not AI chat)

-- ============================================================================
-- CLEANUP FUNCTIONS
-- ============================================================================

-- Remove old chat-related functions if they exist
-- (None were created in the original schema, but this ensures cleanup)

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- What was removed:
-- ✅ chats table (AI conversation history)
--    - Replaced by: chatkit_threads + chatkit_thread_items
--
-- What remains:
-- ✅ messages table (human-to-human messaging)
--    - Still used for venue-client-vendor communication
--    - Not related to ChatKit

-- Benefits of the new ChatKit schema:
-- 1. Proper threading (threads vs items)
-- 2. Flexible content types (messages, widgets, tools)
-- 3. Attachment support
-- 4. Better performance (normalized data)
-- 5. Follows OpenAI ChatKit protocol
-- 6. Row-level security
-- 7. Soft deletes
-- 8. Sequence ordering

COMMENT ON TABLE messages IS 'Human-to-human communication (NOT ChatKit). Used for venue-client-vendor messaging.';
