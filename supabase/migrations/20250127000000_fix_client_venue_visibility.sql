-- Fix RLS policies to allow venues to see clients and clients to see venues
-- for events they're collaborating on

-- ============================================================================
-- CLIENT VISIBILITY FOR VENUES
-- ============================================================================

-- Venues can view clients who have events at their venue
CREATE POLICY "Venues can view event clients"
  ON clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.client_id = clients.client_id
        AND e.venue_id = auth.uid()
    )
  );

-- ============================================================================
-- VENUE VISIBILITY FOR CLIENTS
-- ============================================================================

-- Clients can view venues where they have events
CREATE POLICY "Clients can view event venues"
  ON venues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.venue_id = venues.venue_id
        AND e.client_id = auth.uid()
    )
  );

-- ============================================================================
-- VENDOR VISIBILITY
-- ============================================================================

-- Vendors can view clients for events they're involved in
CREATE POLICY "Vendors can view event clients"
  ON clients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN event_elements ee ON e.event_id = ee.event_id
      JOIN elements el ON ee.element_id = el.element_id
      JOIN venue_vendors vv ON el.venue_vendor_id = vv.venue_vendor_id
      WHERE e.client_id = clients.client_id
        AND vv.vendor_id = auth.uid()
    )
  );

-- Vendors can view venues they're associated with
CREATE POLICY "Vendors can view associated venues"
  ON venues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM venue_vendors vv
      WHERE vv.venue_id = venues.venue_id
        AND vv.vendor_id = auth.uid()
    )
  );
