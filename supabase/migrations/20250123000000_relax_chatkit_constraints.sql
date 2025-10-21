-- Relax ChatKit Thread Constraints
-- Allow threads to be created without event_id/venue_id for testing and general use

-- Drop the existing constraint
ALTER TABLE chatkit_threads DROP CONSTRAINT IF EXISTS chatkit_threads_check;

-- Add a more flexible constraint (optional - can be fully removed)
-- This allows threads without event/venue context for general conversations
ALTER TABLE chatkit_threads ADD CONSTRAINT chatkit_threads_check CHECK (
  (agent_type = 'client') OR
  (agent_type = 'venue_general') OR
  (agent_type = 'venue_event')
);

COMMENT ON CONSTRAINT chatkit_threads_check ON chatkit_threads IS
  'Allow all agent types. Event and venue IDs are optional for general conversations.';
