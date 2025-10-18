-- Fix infinite recursion in events and event_spaces RLS policies
--
-- The problem: Circular dependencies in RLS policies cause infinite recursion when querying
-- events, event_spaces, and event_elements tables. This happens because:
-- 1. event_spaces policy checks events
-- 2. events policy (for vendors) checks event_elements
-- 3. event_elements policy might check back to events
--
-- The solution: Replace correlated subqueries (EXISTS) with uncorrelated subqueries (IN)
-- to break the circular dependency chain.

-- ============================================================================
-- DROP PROBLEMATIC POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Vendors view assigned events" ON events;
DROP POLICY IF EXISTS "Users view event spaces" ON event_spaces;
DROP POLICY IF EXISTS "Vendors view assigned event elements" ON event_elements;

-- ============================================================================
-- RECREATE POLICIES WITHOUT RECURSION
-- ============================================================================

-- Vendors can view events they're assigned to through event_elements
-- Using IN with uncorrelated subquery instead of EXISTS with correlated subquery
CREATE POLICY "Vendors view assigned events simple"
  ON events FOR SELECT
  USING (
    -- Direct check without nested subqueries that reference the outer events table
    event_id IN (
      SELECT ee.event_id
      FROM event_elements ee
      JOIN elements e ON ee.element_id = e.element_id
      JOIN venue_vendors vv ON e.venue_vendor_id = vv.venue_vendor_id
      WHERE vv.vendor_id = auth.uid()
    )
  );

-- Users can view event_spaces for events they have access to
-- Simplified to avoid recursion by using IN clause
CREATE POLICY "Users view event spaces simple"
  ON event_spaces FOR SELECT
  USING (
    -- Check if the event belongs to the user without creating circular dependency
    event_id IN (
      SELECT event_id FROM events
      WHERE client_id = auth.uid() OR venue_id = auth.uid()
    )
  );

-- Vendors can view event_elements for their elements
-- Using IN to avoid circular reference back to events
CREATE POLICY "Vendors view assigned event elements simple"
  ON event_elements FOR SELECT
  USING (
    -- Check element ownership without referencing events
    element_id IN (
      SELECT e.element_id
      FROM elements e
      JOIN venue_vendors vv ON e.venue_vendor_id = vv.venue_vendor_id
      WHERE vv.vendor_id = auth.uid()
    )
  );
