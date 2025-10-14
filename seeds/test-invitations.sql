-- Test Invitation Seeds
-- Use these to manually test the onboarding flows

-- ============================================================================
-- VENUE INVITATION
-- ============================================================================
-- Creates an invitation for a venue to join the platform
-- Navigate to: http://localhost:3000/venue/register/test-venue-token-123

INSERT INTO invitations (
  invitation_id,
  token,
  invitee_email,
  invited_by,
  invitation_type,
  status,
  expires_at,
  metadata,
  created_at
) VALUES (
  gen_random_uuid(),
  'test-venue-token-123',
  'newvenue@example.com',
  (SELECT auth.uid() FROM auth.users LIMIT 1), -- Replace with admin user ID
  'venue',
  'pending',
  NOW() + INTERVAL '7 days',
  '{
    "personal_note": "We are excited to have you join our platform!"
  }'::jsonb,
  NOW()
);

-- ============================================================================
-- CLIENT INVITATION
-- ============================================================================
-- Creates an invitation for a client to confirm their booking
-- Navigate to: http://localhost:3000/client/confirm/test-client-token-456

-- First, create a test event (if you don't have one)
INSERT INTO events (
  event_id,
  name,
  description,
  date,
  client_id,
  venue_id,
  status,
  created_at,
  updated_at
) VALUES (
  'test-event-123',
  'Wedding Reception',
  'John and Jane Wedding',
  NOW() + INTERVAL '60 days',
  NULL, -- Will be filled when client confirms
  (SELECT venue_id FROM venues LIMIT 1), -- Replace with actual venue ID
  'pending_confirmation',
  NOW(),
  NOW()
);

-- Create the client invitation
INSERT INTO invitations (
  invitation_id,
  token,
  invitee_email,
  invited_by,
  invitation_type,
  status,
  expires_at,
  metadata,
  created_at
) VALUES (
  gen_random_uuid(),
  'test-client-token-456',
  'newclient@example.com',
  (SELECT venue_id FROM venues LIMIT 1), -- Venue that sent the invitation
  'client',
  'pending',
  NOW() + INTERVAL '48 hours',
  '{
    "name": "John Smith",
    "phone": "(555) 123-4567",
    "event_id": "test-event-123",
    "event_date": "2025-12-15T18:00:00Z",
    "venue_name": "The Grand Ballroom",
    "space_names": ["Main Ballroom", "Garden Terrace"],
    "guest_count": 150
  }'::jsonb,
  NOW()
);

-- ============================================================================
-- VENDOR INVITATION
-- ============================================================================
-- Creates an invitation for a vendor to join and work with a venue
-- Navigate to: http://localhost:3000/vendor/register/test-vendor-token-789

INSERT INTO invitations (
  invitation_id,
  token,
  invitee_email,
  invited_by,
  invitation_type,
  status,
  expires_at,
  metadata,
  created_at
) VALUES (
  gen_random_uuid(),
  'test-vendor-token-789',
  'newvendor@example.com',
  (SELECT venue_id FROM venues LIMIT 1), -- Venue sending the invitation
  'vendor',
  'pending',
  NOW() + INTERVAL '14 days',
  '{
    "vendor_name": "ABC Catering",
    "vendor_phone": "(555) 987-6543",
    "venue_id": "REPLACE_WITH_ACTUAL_VENUE_ID",
    "venue_name": "The Grand Ballroom",
    "services": ["Catering", "Bar Service"]
  }'::jsonb,
  NOW()
);

-- ============================================================================
-- QUERY TO VIEW ALL TEST INVITATIONS
-- ============================================================================

SELECT
  token,
  invitee_email,
  invitation_type,
  status,
  expires_at,
  metadata
FROM invitations
WHERE token LIKE 'test-%'
ORDER BY created_at DESC;

-- ============================================================================
-- CLEANUP SCRIPT (run this to remove test invitations)
-- ============================================================================

DELETE FROM invitations WHERE token LIKE 'test-%';
