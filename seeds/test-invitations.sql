-- Test Invitation Seeds
-- Use these to manually test the onboarding flows
-- NOTE: Use the individual *-simple.sql files for easier setup!

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
  '00000000-0000-0000-0000-000000000000', -- Placeholder admin ID
  'venue',
  'pending',
  NOW() + INTERVAL '7 days',
  '{}'::jsonb,
  NOW()
);

-- ============================================================================
-- CLIENT INVITATION (Requires a venue to exist first!)
-- ============================================================================
-- RECOMMENDED: Use create-test-client-invitation-simple.sql instead
-- This creates both the event and invitation automatically

-- Manual version (requires you to fill in UUIDs):
-- 1. Get a venue_id: SELECT venue_id FROM venues LIMIT 1;
-- 2. Create event with that venue_id
-- 3. Create invitation with the event_id

-- ============================================================================
-- VENDOR INVITATION (Requires a venue to exist first!)
-- ============================================================================
-- RECOMMENDED: Use create-test-vendor-invitation.sql instead
-- This automatically uses an existing venue

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

-- Delete test invitations
DELETE FROM invitations WHERE token LIKE 'test-%';

-- Delete test events (optional - be careful!)
-- DELETE FROM events WHERE name LIKE 'Test%';
