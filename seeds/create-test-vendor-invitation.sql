-- Simple test vendor invitation creator
-- This script automatically uses the first available venue
-- Run this in your Supabase SQL Editor
-- Then navigate to: http://localhost:3000/vendor/register/test-vendor-token-789

-- Delete any existing test invitation
DELETE FROM invitations WHERE token = 'test-vendor-token-789';

DO $$
DECLARE
  v_venue_id UUID;
  v_venue_name TEXT;
BEGIN
  -- Get the first available venue
  SELECT venue_id, name INTO v_venue_id, v_venue_name
  FROM venues
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_venue_id IS NULL THEN
    RAISE EXCEPTION 'No venues found. Please create a venue first or run the venue onboarding test.';
  END IF;

  -- Create the vendor invitation
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
    v_venue_id,
    'vendor',
    'pending',
    NOW() + INTERVAL '14 days',
    jsonb_build_object(
      'vendor_name', 'ABC Catering',
      'vendor_phone', '(555) 987-6543',
      'venue_id', v_venue_id::text,
      'venue_name', v_venue_name,
      'services', ARRAY['Catering', 'Bar Service']
    ),
    NOW()
  );

  RAISE NOTICE 'Created vendor invitation for venue: %', v_venue_name;
  RAISE NOTICE 'Navigate to: http://localhost:3000/vendor/register/test-vendor-token-789';
END $$;

-- Verify the invitation was created
SELECT
  token,
  invitee_email,
  invitation_type,
  status,
  expires_at,
  metadata->>'venue_name' as venue_name,
  metadata->>'services' as services
FROM invitations
WHERE token = 'test-vendor-token-789';
