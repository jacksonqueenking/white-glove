-- Create a test venue invitation
-- Run this in your Supabase SQL Editor
-- Then navigate to: http://localhost:3000/venue/register/test-venue-token-123

-- Delete any existing test invitation (so you can re-run this script)
DELETE FROM invitations WHERE token = 'test-venue-token-123';

-- Create a fresh invitation
INSERT INTO invitations (
  token,
  invitee_email,
  invited_by,
  invitation_type,
  status,
  expires_at,
  metadata,
  created_at
) VALUES (
  'test-venue-token-123',
  'newvenue@example.com',
  '00000000-0000-0000-0000-000000000000', -- Placeholder admin ID
  'venue',
  'pending',
  NOW() + INTERVAL '7 days',
  '{}'::jsonb,
  NOW()
);

-- Verify it was created
SELECT
  token,
  invitee_email,
  invitation_type,
  status,
  expires_at
FROM invitations
WHERE token = 'test-venue-token-123';
