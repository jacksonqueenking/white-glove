-- Fix infinite recursion in events policies for vendors
--
-- The problem: The "Vendors view assigned events simple" policy still causes
-- recursion because event_elements policies reference back to events.
--
-- Solution: Remove the vendor view policy for events. Vendors don't need to
-- query the events table directly - they interact with events through their
-- assigned event_elements.

-- ============================================================================
-- DROP PROBLEMATIC POLICY
-- ============================================================================

-- Drop the vendor policy that causes recursion
DROP POLICY IF EXISTS "Vendors view assigned events simple" ON events;
DROP POLICY IF EXISTS "Vendors view assigned events" ON events;

-- ============================================================================
-- KEEP EXISTING WORKING POLICIES
-- ============================================================================

-- The following policies remain and work correctly:
-- "Clients view own events" - clients can view events where client_id = auth.uid()
-- "Venues view own events" - venues can view events where venue_id = auth.uid()
-- "Venues can create events" - venues can insert events
-- "Venues can update own events" - venues can update their events
-- "Clients can update own events" - clients can update their events

-- Note: Vendors don't need direct event access. They see event details
-- through event_elements joins in the application layer.
