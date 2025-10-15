-- Create a REAL test client invitation using actual venue data
-- This script:
-- 1. Gets a real venue from your database
-- 2. Gets real spaces from that venue
-- 3. Creates a real event linked to that venue and spaces
-- 4. Creates an invitation with the REAL data
--
-- Run this in your Supabase SQL Editor
-- Then navigate to: http://localhost:3000/client/confirm/test-client-token-456

-- First, delete any existing test invitation with this token
DELETE FROM invitations WHERE token = 'test-client-token-402';

DO $$
DECLARE
  v_venue_id UUID;
  v_venue_name TEXT;
  v_event_id UUID;
  v_space_ids UUID[];
  v_space_names TEXT[];
BEGIN
  -- Get the most recently created venue (the one you just registered)
  SELECT venue_id, name
  INTO v_venue_id, v_venue_name
  FROM venues
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_venue_id IS NULL THEN
    RAISE EXCEPTION 'No venues found. Please create a venue first by running the venue onboarding test.';
  END IF;

  -- Get the actual spaces from this venue
  SELECT
    array_agg(space_id),
    array_agg(name)
  INTO v_space_ids, v_space_names
  FROM spaces
  WHERE venue_id = v_venue_id
  AND deleted_at IS NULL;

  IF v_space_ids IS NULL OR array_length(v_space_ids, 1) = 0 THEN
    RAISE EXCEPTION 'No spaces found for venue "%". Please add spaces to the venue first.', v_venue_name;
  END IF;

  -- Create a real event at this venue
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
    gen_random_uuid(),
    'Wedding Reception - Smith & Johnson',
    'John and Jane Wedding Reception',
    NOW() + INTERVAL '60 days',
    NULL, -- Will be filled when client confirms
    v_venue_id,
    'pending_confirmation',
    NOW(),
    NOW()
  )
  RETURNING event_id INTO v_event_id;

  -- Link the event to the venue's spaces
  INSERT INTO event_spaces (event_id, space_id)
  SELECT v_event_id, unnest(v_space_ids);

  -- Create the client invitation with REAL venue data
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
    'test-client-token-402',
    'jacksonwhurley@gmail.com',
    v_venue_id,
    'client',
    'pending',
    NOW() + INTERVAL '48 hours',
    jsonb_build_object(
      'name', 'John Smith',
      'phone', '(555) 123-4567',
      'event_id', v_event_id::text,
      'event_date', (NOW() + INTERVAL '60 days')::text,
      'venue_name', v_venue_name,  -- REAL venue name from database
      'space_names', v_space_names, -- REAL space names from database
      'guest_count', 150
    ),
    NOW()
  );

  RAISE NOTICE '✓ Created real event at venue: %', v_venue_name;
  RAISE NOTICE '✓ Event ID: %', v_event_id;
  RAISE NOTICE '✓ Using spaces: %', v_space_names;
  RAISE NOTICE '';
  RAISE NOTICE 'Navigate to: http://localhost:3000/client/confirm/test-client-token-402';
END $$;

-- Verify everything was created correctly
SELECT
  i.token,
  i.invitee_email,
  i.invitation_type,
  i.status,
  i.metadata->>'venue_name' as venue_name,
  i.metadata->>'space_names' as space_names,
  e.event_id,
  e.name as event_name,
  e.venue_id,
  v.name as actual_venue_name
FROM invitations i
JOIN events e ON (i.metadata->>'event_id')::uuid = e.event_id
JOIN venues v ON e.venue_id = v.venue_id
WHERE i.token = 'test-client-token-402';

-- Show the spaces linked to this event
SELECT
  e.name as event_name,
  s.name as space_name,
  s.capacity
FROM events e
JOIN event_spaces es ON e.event_id = es.event_id
JOIN spaces s ON es.space_id = s.space_id
WHERE e.event_id = (
  SELECT (metadata->>'event_id')::uuid
  FROM invitations
  WHERE token = 'test-client-token-456'
);
