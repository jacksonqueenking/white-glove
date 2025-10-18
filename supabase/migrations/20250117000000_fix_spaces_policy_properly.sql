-- Fix the spaces policy that's causing the actual recursion
--
-- The REAL problem: The "Clients view spaces for their venue" policy queries the events table,
-- which creates recursion when combined with the events table policies.
--
-- When a VENUE user queries spaces:
-- 1. Query spaces table
-- 2. RLS checks "Clients view spaces for their venue" policy (even though user is a venue!)
-- 3. That policy queries events table
-- 4. Events table policies cause recursion
--
-- Solution: The venue policy "Venues manage own spaces" should be sufficient for venues.
-- The client policy should not trigger for venue users.

-- Drop the problematic client policy that references events
DROP POLICY IF EXISTS "Clients view spaces for their venue" ON spaces;

-- The "Venues manage own spaces" policy already exists and works correctly:
-- CREATE POLICY "Venues manage own spaces"
--   ON spaces FOR ALL
--   USING (auth.uid() = venue_id);
--
-- This is sufficient for venue users to see their own spaces.

-- Clients don't need to see spaces directly - they interact with spaces through events.
-- If clients need to see spaces, it should be done through application logic, not RLS.
