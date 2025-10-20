-- Fix ChatKit Foreign Key Constraints
--
-- Replace strict CASCADE foreign keys with ON DELETE SET NULL.
-- This provides data integrity while allowing flexibility.
--
-- Benefits:
-- - Database validates that event_id/venue_id are real (when not NULL)
-- - Allows NULL values for testing or context-free agents
-- - Automatic cleanup when events/venues are deleted (sets to NULL)
-- - Preserves chat history even if entity is removed
-- - Better data quality long-term

-- ============================================================================
-- DROP AND RECREATE FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- First drop the existing constraints
ALTER TABLE chatkit_threads
  DROP CONSTRAINT IF EXISTS chatkit_threads_event_id_fkey;

ALTER TABLE chatkit_threads
  DROP CONSTRAINT IF EXISTS chatkit_threads_venue_id_fkey;

-- Recreate with ON DELETE SET NULL
ALTER TABLE chatkit_threads
  ADD CONSTRAINT chatkit_threads_event_id_fkey
  FOREIGN KEY (event_id)
  REFERENCES events(event_id)
  ON DELETE SET NULL;

ALTER TABLE chatkit_threads
  ADD CONSTRAINT chatkit_threads_venue_id_fkey
  FOREIGN KEY (venue_id)
  REFERENCES venues(venue_id)
  ON DELETE SET NULL;

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- Why ON DELETE SET NULL instead of CASCADE or no constraint?
--
-- 1. Data Integrity
--    - Database validates event_id/venue_id point to real records
--    - Catches bugs where wrong IDs are used
--    - Maintains referential integrity
--
-- 2. Flexibility
--    - NULL values allowed (for testing or agents without context)
--    - Threads can outlive their associated events/venues
--    - No blocking of event/venue deletions
--
-- 3. Automatic Cleanup
--    - When event/venue deleted, field automatically set to NULL
--    - No orphaned references
--    - Chat history preserved but context cleared
--
-- 4. Better Data Quality
--    - Only valid or NULL values in database
--    - Easy to query for threads with/without context
--    - Prevents accumulation of invalid references

-- The CHECK constraint remains to ensure agent_type has required IDs:
-- - client agent requires event_id
-- - venue_general agent requires venue_id
-- - venue_event agent requires both event_id and venue_id

COMMENT ON COLUMN chatkit_threads.event_id IS 'Context UUID for event (FK with ON DELETE SET NULL)';
COMMENT ON COLUMN chatkit_threads.venue_id IS 'Context UUID for venue (FK with ON DELETE SET NULL)';
