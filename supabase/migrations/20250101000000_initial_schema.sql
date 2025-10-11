-- White Glove Event Management Platform - Initial Schema Migration
-- This migration creates all tables, relationships, indexes, and triggers

-- Note: Using gen_random_uuid() which is built into Postgres 13+
-- No need to enable uuid-ossp extension

-- ============================================================================
-- CORE USER TABLES
-- ============================================================================

-- Clients table (linked to auth.users)
CREATE TABLE clients (
  client_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  credit_card_stripe_id TEXT, -- Stripe customer ID (tokenized)
  billing_address JSONB, -- {street, city, state, zip, country}
  preferences JSONB DEFAULT '{"people": [], "food": "", "notes": ""}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Venues table (linked to auth.users)
CREATE TABLE venues (
  venue_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address JSONB NOT NULL, -- {street, city, state, zip, country}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Vendors table (linked to auth.users)
CREATE TABLE vendors (
  vendor_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT NOT NULL,
  address JSONB NOT NULL, -- {street, city, state, zip, country}
  description TEXT,
  contact_persons JSONB DEFAULT '[]'::jsonb, -- [{name, role, email, phone, is_primary}]
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- VENUE-VENDOR RELATIONSHIPS
-- ============================================================================

-- VenueVendor relationship table
CREATE TABLE venue_vendors (
  venue_vendor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'n/a')),
  cois JSONB DEFAULT '[]'::jsonb, -- [{document_url, completed, expiration_date, insurance_type, coverage_amount}]
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(venue_id, vendor_id)
);

-- ============================================================================
-- SPACES
-- ============================================================================

-- Spaces within venues
CREATE TABLE spaces (
  space_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  main_image_url TEXT,
  photos JSONB DEFAULT '[]'::jsonb, -- [{url, caption, order}]
  floorplan_url TEXT,
  capacity INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- EVENTS
-- ============================================================================

-- Events table
CREATE TABLE events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  client_id UUID REFERENCES clients(client_id) ON DELETE SET NULL,
  venue_id UUID NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
  calendar JSONB, -- {date, timeline: [{time, duration_minutes, activity, space_id, notes}]}
  status TEXT NOT NULL DEFAULT 'inquiry' CHECK (status IN (
    'inquiry',
    'pending_confirmation',
    'confirmed',
    'in_planning',
    'finalized',
    'completed',
    'cancelled'
  )),
  rsvp_deadline DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Event-Space junction table (many-to-many)
CREATE TABLE event_spaces (
  event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
  space_id UUID NOT NULL REFERENCES spaces(space_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, space_id)
);

-- ============================================================================
-- ELEMENTS (Services/Products)
-- ============================================================================

-- Elements (services/products offered by venue_vendors)
CREATE TABLE elements (
  element_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_vendor_id UUID NOT NULL REFERENCES venue_vendors(venue_vendor_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT, -- "catering", "photography", "florals", "entertainment", etc.
  image_url TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  description TEXT,
  files JSONB DEFAULT '[]'::jsonb, -- References to files table: [{file_id, description}]
  contract JSONB, -- Contract template or terms specific to this element
  availability_rules JSONB DEFAULT '{"lead_time_days": 0}'::jsonb, -- {lead_time_days, blackout_dates, seasonal_pricing}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Event-Element junction table with event-specific details
CREATE TABLE event_elements (
  event_element_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
  element_id UUID NOT NULL REFERENCES elements(element_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'to-do' CHECK (status IN ('to-do', 'in_progress', 'completed', 'needs_attention')),
  customization TEXT, -- Event-specific customization details
  amount DECIMAL(10, 2) NOT NULL, -- Final agreed price (may differ from element base price)
  contract_completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- CONTRACTS & PAYMENTS
-- ============================================================================

-- Contracts for events
CREATE TABLE contracts (
  contract_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_schedule JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{description, amount, due_date, paid, paid_at, stripe_payment_intent_id}]
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_signature', 'signed', 'paid', 'partially_paid')),
  stripe_payment_intent_ids JSONB DEFAULT '[]'::jsonb, -- Array of Stripe payment intent IDs
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TASKS
-- ============================================================================

-- Tasks for users
CREATE TABLE tasks (
  task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
  assigned_to_id UUID NOT NULL, -- User ID (client, venue, or vendor)
  assigned_to_type TEXT NOT NULL CHECK (assigned_to_type IN ('client', 'venue', 'vendor')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  form_schema JSONB, -- Dynamic form definition
  form_response JSONB, -- User's response data
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMPTZ,
  created_by TEXT NOT NULL, -- 'orchestrator' or user_id
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================================================
-- GUESTS
-- ============================================================================

-- Event guests
CREATE TABLE guests (
  guest_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT, -- "Dr.", "CEO", etc.
  phone TEXT,
  email TEXT,
  notes TEXT,
  rsvp_status TEXT NOT NULL DEFAULT 'undecided' CHECK (rsvp_status IN ('yes', 'no', 'undecided')),
  dietary_restrictions TEXT,
  plus_one BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- MESSAGING
-- ============================================================================

-- Messages (human-to-human communication)
CREATE TABLE messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL, -- Groups related messages
  event_id UUID REFERENCES events(event_id) ON DELETE SET NULL,
  sender_id UUID NOT NULL, -- User ID
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'venue', 'vendor')),
  recipient_id UUID NOT NULL, -- User ID
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('client', 'venue', 'vendor')),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb, -- [{url, filename, mimetype, size}]
  action_required BOOLEAN DEFAULT FALSE,
  suggested_response TEXT, -- AI-generated suggested reply
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chats (AI conversation history)
CREATE TABLE chats (
  chat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Client or venue user
  user_type TEXT NOT NULL CHECK (user_type IN ('client', 'venue')),
  event_id UUID REFERENCES events(event_id) ON DELETE SET NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{role, content, timestamp, tool_calls}]
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

-- Notifications
CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- User receiving notification
  user_type TEXT NOT NULL CHECK (user_type IN ('client', 'venue', 'vendor')),
  notification_type TEXT NOT NULL, -- "task_created", "message_received", "payment_due", etc.
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT, -- URL to navigate to when clicked
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ACTION HISTORY (Audit Log)
-- ============================================================================

-- Action history for audit trail
CREATE TABLE action_history (
  action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(event_id) ON DELETE SET NULL,
  user_id UUID, -- Who performed the action (null for system)
  user_type TEXT CHECK (user_type IN ('client', 'venue', 'vendor', 'system')),
  action_type TEXT NOT NULL, -- "element_added", "status_changed", "message_sent", etc.
  description TEXT NOT NULL,
  metadata JSONB, -- Action-specific data
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- FILES
-- ============================================================================

-- File storage references (Supabase Storage)
CREATE TABLE files (
  file_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_type TEXT NOT NULL, -- MIME type
  file_size INTEGER NOT NULL, -- Size in bytes
  uploaded_by UUID NOT NULL, -- User who uploaded
  related_to_type TEXT, -- "element", "coi", "space", "message", etc.
  related_to_id UUID, -- ID of related entity
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INVITATIONS
-- ============================================================================

-- Invitations for onboarding
CREATE TABLE invitations (
  invitation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  invitee_email TEXT NOT NULL,
  invited_by UUID NOT NULL, -- User who sent invitation
  invitation_type TEXT NOT NULL CHECK (invitation_type IN ('venue', 'vendor', 'client')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  metadata JSONB, -- venue_id for vendor invitations, event_id for client confirmations, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Events indexes
CREATE INDEX idx_events_client_id ON events(client_id);
CREATE INDEX idx_events_venue_id ON events(venue_id);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_deleted_at ON events(deleted_at) WHERE deleted_at IS NULL;

-- Tasks indexes
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to_id, assigned_to_type);
CREATE INDEX idx_tasks_event_id ON tasks(event_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_priority ON tasks(priority);

-- Messages indexes
CREATE INDEX idx_messages_thread_id ON messages(thread_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id, recipient_type);
CREATE INDEX idx_messages_event_id ON messages(event_id);
CREATE INDEX idx_messages_read ON messages(read) WHERE read = FALSE;

-- Guests indexes
CREATE INDEX idx_guests_event_id ON guests(event_id);
CREATE INDEX idx_guests_rsvp_status ON guests(rsvp_status);

-- Notifications indexes
CREATE INDEX idx_notifications_user ON notifications(user_id, user_type);
CREATE INDEX idx_notifications_read ON notifications(read) WHERE read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Chats indexes
CREATE INDEX idx_chats_user ON chats(user_id, user_type);
CREATE INDEX idx_chats_event_id ON chats(event_id);
CREATE INDEX idx_chats_archived ON chats(archived) WHERE archived = FALSE;

-- Spaces indexes
CREATE INDEX idx_spaces_venue_id ON spaces(venue_id);
CREATE INDEX idx_spaces_deleted_at ON spaces(deleted_at) WHERE deleted_at IS NULL;

-- Elements indexes
CREATE INDEX idx_elements_venue_vendor_id ON elements(venue_vendor_id);
CREATE INDEX idx_elements_category ON elements(category);
CREATE INDEX idx_elements_deleted_at ON elements(deleted_at) WHERE deleted_at IS NULL;

-- Event elements indexes
CREATE INDEX idx_event_elements_event_id ON event_elements(event_id);
CREATE INDEX idx_event_elements_element_id ON event_elements(element_id);
CREATE INDEX idx_event_elements_status ON event_elements(status);

-- Venue vendors indexes
CREATE INDEX idx_venue_vendors_venue_id ON venue_vendors(venue_id);
CREATE INDEX idx_venue_vendors_vendor_id ON venue_vendors(vendor_id);
CREATE INDEX idx_venue_vendors_approval_status ON venue_vendors(approval_status);

-- Files indexes
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX idx_files_related_to ON files(related_to_type, related_to_id);

-- Invitations indexes
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_invitations_invitee_email ON invitations(invitee_email);

-- Action history indexes
CREATE INDEX idx_action_history_event_id ON action_history(event_id);
CREATE INDEX idx_action_history_user_id ON action_history(user_id);
CREATE INDEX idx_action_history_created_at ON action_history(created_at DESC);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venue_vendors_updated_at BEFORE UPDATE ON venue_vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spaces_updated_at BEFORE UPDATE ON spaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_elements_updated_at BEFORE UPDATE ON elements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_elements_updated_at BEFORE UPDATE ON event_elements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE clients IS 'Client users who book events';
COMMENT ON TABLE venues IS 'Venue locations that host events';
COMMENT ON TABLE vendors IS 'Service providers (caterers, photographers, etc.)';
COMMENT ON TABLE venue_vendors IS 'Relationship between venues and their approved vendors';
COMMENT ON TABLE spaces IS 'Bookable spaces within venues';
COMMENT ON TABLE events IS 'Scheduled events';
COMMENT ON TABLE event_spaces IS 'Many-to-many relationship between events and spaces';
COMMENT ON TABLE elements IS 'Services/products that can be offered';
COMMENT ON TABLE event_elements IS 'Elements assigned to specific events with customization';
COMMENT ON TABLE contracts IS 'Payment contracts for events';
COMMENT ON TABLE tasks IS 'Action items assigned to users';
COMMENT ON TABLE guests IS 'Event attendees';
COMMENT ON TABLE messages IS 'Human-to-human communication';
COMMENT ON TABLE chats IS 'AI assistant conversation history';
COMMENT ON TABLE notifications IS 'In-app notifications for users';
COMMENT ON TABLE action_history IS 'Audit log of all actions';
COMMENT ON TABLE files IS 'File storage references for Supabase Storage';
COMMENT ON TABLE invitations IS 'Invitation tokens for user onboarding';
