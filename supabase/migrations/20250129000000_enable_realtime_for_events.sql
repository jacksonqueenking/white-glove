-- Enable Supabase Realtime for event-related tables
-- This allows filtered subscriptions in EventDetailPanelRealtime to receive change notifications

-- Set replica identity to FULL so all columns are included in change notifications
-- This is required for filtered subscriptions to work (e.g., filter: event_id=eq.xxx)
-- Without FULL replica identity, only the primary key is included in notifications
ALTER TABLE events REPLICA IDENTITY FULL;
ALTER TABLE event_elements REPLICA IDENTITY FULL;
ALTER TABLE tasks REPLICA IDENTITY FULL;
ALTER TABLE guests REPLICA IDENTITY FULL;

-- Add tables to supabase_realtime publication
-- This tells Supabase to broadcast changes to these tables via websockets
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE event_elements;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE guests;
