-- Row-Level Security (RLS) Policies
-- These policies ensure users can only access data they're authorized to see

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get current user's type from metadata
CREATE OR REPLACE FUNCTION get_user_type()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'user_type')::TEXT,
    'unknown'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is a client
CREATE OR REPLACE FUNCTION is_client()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_type() = 'client';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is a venue
CREATE OR REPLACE FUNCTION is_venue()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_type() = 'venue';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is a vendor
CREATE OR REPLACE FUNCTION is_vendor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_type() = 'vendor';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CLIENT POLICIES
-- ============================================================================

-- Clients can view their own record
CREATE POLICY "Clients can view own profile"
  ON clients FOR SELECT
  USING (auth.uid() = client_id);

-- Clients can update their own record
CREATE POLICY "Clients can update own profile"
  ON clients FOR UPDATE
  USING (auth.uid() = client_id);

-- ============================================================================
-- VENUE POLICIES
-- ============================================================================

-- Venues can view their own record
CREATE POLICY "Venues can view own profile"
  ON venues FOR SELECT
  USING (auth.uid() = venue_id);

-- Venues can update their own record
CREATE POLICY "Venues can update own profile"
  ON venues FOR UPDATE
  USING (auth.uid() = venue_id);

-- ============================================================================
-- VENDOR POLICIES
-- ============================================================================

-- Vendors can view their own record
CREATE POLICY "Vendors can view own profile"
  ON vendors FOR SELECT
  USING (auth.uid() = vendor_id);

-- Vendors can update their own record
CREATE POLICY "Vendors can update own profile"
  ON vendors FOR UPDATE
  USING (auth.uid() = vendor_id);

-- ============================================================================
-- EVENT POLICIES
-- ============================================================================

-- Clients can view their own events
CREATE POLICY "Clients view own events"
  ON events FOR SELECT
  USING (auth.uid() = client_id);

-- Venues can view their events
CREATE POLICY "Venues view own events"
  ON events FOR SELECT
  USING (auth.uid() = venue_id);

-- Vendors can view events they're involved in
CREATE POLICY "Vendors view assigned events"
  ON events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_elements ee
      JOIN elements e ON ee.element_id = e.element_id
      JOIN venue_vendors vv ON e.venue_vendor_id = vv.venue_vendor_id
      WHERE ee.event_id = events.event_id
        AND vv.vendor_id = auth.uid()
    )
  );

-- Venues can insert events
CREATE POLICY "Venues can create events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = venue_id AND is_venue());

-- Venues can update their events
CREATE POLICY "Venues can update own events"
  ON events FOR UPDATE
  USING (auth.uid() = venue_id);

-- Clients can update their events (limited fields via application logic)
CREATE POLICY "Clients can update own events"
  ON events FOR UPDATE
  USING (auth.uid() = client_id);

-- ============================================================================
-- SPACE POLICIES
-- ============================================================================

-- Venues can manage their spaces
CREATE POLICY "Venues manage own spaces"
  ON spaces FOR ALL
  USING (auth.uid() = venue_id);

-- Clients can view spaces for their events
CREATE POLICY "Clients view event spaces"
  ON spaces FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN event_spaces es ON e.event_id = es.event_id
      WHERE es.space_id = spaces.space_id
        AND e.client_id = auth.uid()
    )
  );

-- Public can view spaces (for browsing venues)
CREATE POLICY "Public can view spaces"
  ON spaces FOR SELECT
  USING (deleted_at IS NULL);

-- ============================================================================
-- ELEMENT POLICIES
-- ============================================================================

-- Venues can manage elements for their venue_vendors
CREATE POLICY "Venues manage own elements"
  ON elements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM venue_vendors vv
      WHERE vv.venue_vendor_id = elements.venue_vendor_id
        AND vv.venue_id = auth.uid()
    )
  );

-- Vendors can view and manage their elements
CREATE POLICY "Vendors manage own elements"
  ON elements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM venue_vendors vv
      WHERE vv.venue_vendor_id = elements.venue_vendor_id
        AND vv.vendor_id = auth.uid()
    )
  );

-- Clients can view elements for their events
CREATE POLICY "Clients view event elements"
  ON elements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_elements ee
      JOIN events e ON ee.event_id = e.event_id
      WHERE ee.element_id = elements.element_id
        AND e.client_id = auth.uid()
    )
  );

-- ============================================================================
-- EVENT ELEMENT POLICIES
-- ============================================================================

-- Clients can view event_elements for their events
CREATE POLICY "Clients view own event elements"
  ON event_elements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.event_id = event_elements.event_id
        AND e.client_id = auth.uid()
    )
  );

-- Venues can manage event_elements for their events
CREATE POLICY "Venues manage event elements"
  ON event_elements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.event_id = event_elements.event_id
        AND e.venue_id = auth.uid()
    )
  );

-- Vendors can view event_elements for their elements
CREATE POLICY "Vendors view assigned event elements"
  ON event_elements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM elements el
      JOIN venue_vendors vv ON el.venue_vendor_id = vv.venue_vendor_id
      WHERE el.element_id = event_elements.element_id
        AND vv.vendor_id = auth.uid()
    )
  );

-- ============================================================================
-- TASK POLICIES
-- ============================================================================

-- Users can view tasks assigned to them
CREATE POLICY "Users view assigned tasks"
  ON tasks FOR SELECT
  USING (
    assigned_to_id = auth.uid() AND
    assigned_to_type = get_user_type()
  );

-- Users can update tasks assigned to them
CREATE POLICY "Users update assigned tasks"
  ON tasks FOR UPDATE
  USING (
    assigned_to_id = auth.uid() AND
    assigned_to_type = get_user_type()
  );

-- Venues can create and manage all tasks for their events
CREATE POLICY "Venues manage event tasks"
  ON tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.event_id = tasks.event_id
        AND e.venue_id = auth.uid()
    )
  );

-- ============================================================================
-- GUEST POLICIES
-- ============================================================================

-- Clients can manage guests for their events
CREATE POLICY "Clients manage own event guests"
  ON guests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.event_id = guests.event_id
        AND e.client_id = auth.uid()
    )
  );

-- Venues can view and manage guests for their events
CREATE POLICY "Venues manage event guests"
  ON guests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.event_id = guests.event_id
        AND e.venue_id = auth.uid()
    )
  );

-- ============================================================================
-- MESSAGE POLICIES
-- ============================================================================

-- Users can view messages where they are sender or recipient
CREATE POLICY "Users view own messages"
  ON messages FOR SELECT
  USING (
    (sender_id = auth.uid() AND sender_type = get_user_type()) OR
    (recipient_id = auth.uid() AND recipient_type = get_user_type())
  );

-- Users can insert messages where they are the sender
CREATE POLICY "Users send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    sender_type = get_user_type()
  );

-- Users can update messages they received (for marking as read)
CREATE POLICY "Users update received messages"
  ON messages FOR UPDATE
  USING (
    recipient_id = auth.uid() AND
    recipient_type = get_user_type()
  );

-- ============================================================================
-- CHAT POLICIES
-- ============================================================================

-- Users can view their own chats
CREATE POLICY "Users view own chats"
  ON chats FOR SELECT
  USING (
    user_id = auth.uid() AND
    user_type = get_user_type()
  );

-- Users can manage their own chats
CREATE POLICY "Users manage own chats"
  ON chats FOR ALL
  USING (
    user_id = auth.uid() AND
    user_type = get_user_type()
  );

-- ============================================================================
-- NOTIFICATION POLICIES
-- ============================================================================

-- Users can view their own notifications
CREATE POLICY "Users view own notifications"
  ON notifications FOR SELECT
  USING (
    user_id = auth.uid() AND
    user_type = get_user_type()
  );

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE
  USING (
    user_id = auth.uid() AND
    user_type = get_user_type()
  );

-- System can insert notifications (via service role)
-- No policy needed - will use service role key

-- ============================================================================
-- CONTRACT POLICIES
-- ============================================================================

-- Clients can view contracts for their events
CREATE POLICY "Clients view own contracts"
  ON contracts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.event_id = contracts.event_id
        AND e.client_id = auth.uid()
    )
  );

-- Venues can manage contracts for their events
CREATE POLICY "Venues manage event contracts"
  ON contracts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.event_id = contracts.event_id
        AND e.venue_id = auth.uid()
    )
  );

-- ============================================================================
-- VENUE VENDOR POLICIES
-- ============================================================================

-- Venues can manage their venue_vendor relationships
CREATE POLICY "Venues manage venue vendors"
  ON venue_vendors FOR ALL
  USING (venue_id = auth.uid());

-- Vendors can view their venue_vendor relationships
CREATE POLICY "Vendors view venue vendors"
  ON venue_vendors FOR SELECT
  USING (vendor_id = auth.uid());

-- Vendors can update their relationships (limited via application logic)
CREATE POLICY "Vendors update venue vendors"
  ON venue_vendors FOR UPDATE
  USING (vendor_id = auth.uid());

-- ============================================================================
-- FILE POLICIES
-- ============================================================================

-- Users can view files they uploaded
CREATE POLICY "Users view own files"
  ON files FOR SELECT
  USING (uploaded_by = auth.uid());

-- Users can upload files
CREATE POLICY "Users upload files"
  ON files FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

-- Users can view files related to their events
CREATE POLICY "Users view event files"
  ON files FOR SELECT
  USING (
    related_to_type = 'event' AND
    (
      -- Client viewing their event files
      (is_client() AND EXISTS (
        SELECT 1 FROM events e
        WHERE e.event_id = files.related_to_id::uuid
          AND e.client_id = auth.uid()
      )) OR
      -- Venue viewing their event files
      (is_venue() AND EXISTS (
        SELECT 1 FROM events e
        WHERE e.event_id = files.related_to_id::uuid
          AND e.venue_id = auth.uid()
      ))
    )
  );

-- ============================================================================
-- INVITATION POLICIES
-- ============================================================================

-- Anyone can view invitations by token (for verification)
CREATE POLICY "Public can view invitations by token"
  ON invitations FOR SELECT
  USING (status = 'pending');

-- Users who created invitations can view them
CREATE POLICY "Users view own invitations"
  ON invitations FOR SELECT
  USING (invited_by = auth.uid());

-- Venues can create invitations
CREATE POLICY "Venues create invitations"
  ON invitations FOR INSERT
  WITH CHECK (is_venue() AND invited_by = auth.uid());

-- Users can update invitations (for accepting/declining)
CREATE POLICY "Users update invitations"
  ON invitations FOR UPDATE
  USING (TRUE); -- Allow updates for accepting invitations

-- ============================================================================
-- ACTION HISTORY POLICIES
-- ============================================================================

-- Users can view action history for their events
CREATE POLICY "Clients view own event history"
  ON action_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.event_id = action_history.event_id
        AND e.client_id = auth.uid()
    )
  );

CREATE POLICY "Venues view event history"
  ON action_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.event_id = action_history.event_id
        AND e.venue_id = auth.uid()
    )
  );

CREATE POLICY "Vendors view relevant history"
  ON action_history FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM events e
      JOIN event_elements ee ON e.event_id = ee.event_id
      JOIN elements el ON ee.element_id = el.element_id
      JOIN venue_vendors vv ON el.venue_vendor_id = vv.venue_vendor_id
      WHERE e.event_id = action_history.event_id
        AND vv.vendor_id = auth.uid()
    )
  );

-- System can insert action history (via service role)
-- No policy needed - will use service role key

-- ============================================================================
-- EVENT SPACES POLICIES
-- ============================================================================

-- Users who can view events can view event_spaces
CREATE POLICY "Users view event spaces"
  ON event_spaces FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.event_id = event_spaces.event_id
        AND (
          e.client_id = auth.uid() OR
          e.venue_id = auth.uid()
        )
    )
  );

-- Venues can manage event_spaces for their events
CREATE POLICY "Venues manage event spaces"
  ON event_spaces FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.event_id = event_spaces.event_id
        AND e.venue_id = auth.uid()
    )
  );
