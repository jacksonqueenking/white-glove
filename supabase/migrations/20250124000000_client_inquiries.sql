-- Client Inquiries Schema
-- This migration adds support for pre-account client inquiry forms

-- ============================================================================
-- CLIENT INQUIRIES TABLE
-- ============================================================================

-- Table to store client inquiries before they create an account
CREATE TABLE client_inquiries (
  inquiry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,

  -- Client information from form
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  company_name TEXT, -- Optional for corporate events

  -- Event details
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  event_type TEXT, -- Optional: "Wedding", "Corporate", "Birthday", etc.
  space_ids UUID[] NOT NULL, -- Array of space IDs requested
  guest_count INTEGER NOT NULL CHECK (guest_count > 0),
  budget DECIMAL(10, 2) NOT NULL CHECK (budget >= 0),
  description TEXT NOT NULL,

  -- Preferred contact method (optional)
  preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'either')),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Awaiting venue review
    'approved',     -- Venue approved, invitation sent
    'declined',     -- Venue declined
    'expired'       -- Client didn't respond to approval
  )),

  -- If declined, venue can provide reason
  decline_reason TEXT,
  alternative_dates JSONB, -- [{date, time, notes}] if venue suggests alternatives

  -- If approved, track the created event and invitation
  event_id UUID REFERENCES events(event_id) ON DELETE SET NULL,
  invitation_token TEXT UNIQUE,
  invitation_sent_at TIMESTAMPTZ,
  invitation_expires_at TIMESTAMPTZ,

  -- Venue notes
  venue_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ, -- When venue approved/declined

  -- Metadata
  source TEXT DEFAULT 'website', -- Where the inquiry came from
  ip_address TEXT,
  user_agent TEXT
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_client_inquiries_venue_id ON client_inquiries(venue_id);
CREATE INDEX idx_client_inquiries_status ON client_inquiries(status);
CREATE INDEX idx_client_inquiries_event_date ON client_inquiries(event_date);
CREATE INDEX idx_client_inquiries_created_at ON client_inquiries(created_at);
CREATE INDEX idx_client_inquiries_email ON client_inquiries(client_email);
CREATE INDEX idx_client_inquiries_invitation_token ON client_inquiries(invitation_token) WHERE invitation_token IS NOT NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_client_inquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_client_inquiries_updated_at
  BEFORE UPDATE ON client_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_client_inquiries_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE client_inquiries ENABLE ROW LEVEL SECURITY;

-- Venues can view their own inquiries
CREATE POLICY "Venues view own inquiries"
  ON client_inquiries FOR SELECT
  USING (
    venue_id IN (
      SELECT venue_id FROM venues WHERE venue_id = auth.uid()
    )
  );

-- Venues can update their own inquiries
CREATE POLICY "Venues update own inquiries"
  ON client_inquiries FOR UPDATE
  USING (
    venue_id IN (
      SELECT venue_id FROM venues WHERE venue_id = auth.uid()
    )
  );

-- Allow anonymous inserts (for public inquiry form)
-- We'll validate venue_id exists in the API endpoint
CREATE POLICY "Allow anonymous inquiry submissions"
  ON client_inquiries FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if a space is available on a given date
CREATE OR REPLACE FUNCTION check_space_availability(
  p_space_ids UUID[],
  p_event_date DATE,
  p_event_time TIME
)
RETURNS JSONB AS $$
DECLARE
  v_conflicts JSONB;
  v_available BOOLEAN;
BEGIN
  -- Check for conflicting events on the same date
  SELECT JSONB_AGG(
    JSONB_BUILD_OBJECT(
      'space_id', es.space_id,
      'event_id', e.event_id,
      'event_name', e.name,
      'event_date', e.date
    )
  ) INTO v_conflicts
  FROM events e
  JOIN event_spaces es ON e.event_id = es.event_id
  WHERE es.space_id = ANY(p_space_ids)
    AND DATE(e.date) = p_event_date
    AND e.status NOT IN ('cancelled', 'inquiry')
    AND e.deleted_at IS NULL;

  v_available := (v_conflicts IS NULL);

  RETURN JSONB_BUILD_OBJECT(
    'available', v_available,
    'conflicts', COALESCE(v_conflicts, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION check_space_availability TO authenticated, anon;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE client_inquiries IS 'Stores client inquiry requests before they create an account';
COMMENT ON COLUMN client_inquiries.status IS 'Current status of the inquiry: pending (awaiting venue review), approved (venue accepted, invitation sent), declined (venue rejected), expired (client did not respond)';
COMMENT ON COLUMN client_inquiries.invitation_token IS 'Token for the client to confirm booking and create account';
COMMENT ON COLUMN client_inquiries.event_id IS 'Created event ID after venue approves (status=inquiry initially)';
