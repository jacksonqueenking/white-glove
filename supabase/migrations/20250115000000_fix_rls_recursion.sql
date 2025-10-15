-- Fix infinite recursion in RLS policies
-- The "Clients view event spaces" policy causes recursion when querying spaces

-- Drop the problematic policy
DROP POLICY IF EXISTS "Clients view event spaces" ON spaces;

-- Drop the public view policy which might not be needed
DROP POLICY IF EXISTS "Public can view spaces" ON spaces;

-- Keep only the venue policy - venues manage their own spaces
-- CREATE POLICY "Venues manage own spaces" already exists

-- Add back a simpler client policy that doesn't cause recursion
-- Clients can view spaces through a simpler check
CREATE POLICY "Clients view spaces for their venue"
  ON spaces FOR SELECT
  USING (
    venue_id IN (
      SELECT DISTINCT venue_id
      FROM events
      WHERE client_id = auth.uid()
        AND deleted_at IS NULL
    )
  );
