-- Make tasks.event_id nullable to support inquiry tasks without events
ALTER TABLE tasks ALTER COLUMN event_id DROP NOT NULL;

-- Add a comment explaining the change
COMMENT ON COLUMN tasks.event_id IS 'Event ID - nullable for tasks not associated with a specific event (e.g., inquiry review tasks)';
