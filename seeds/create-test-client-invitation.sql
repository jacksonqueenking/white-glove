-- Create a test client invitation
-- Run this in your Supabase SQL Editor
-- Then navigate to: http://localhost:3000/client/confirm/test-client-token-456

-- Step 1: First, we need to get a venue_id to use (or create a test venue)
-- Replace 'YOUR_VENUE_ID' below with an actual venue_id from your venues table

-- To see available venues:
SELECT venue_id, name FROM venues LIMIT 5;

-- Step 2: Create a test event (using proper UUID)
-- Make sure to replace 'YOUR_VENUE_ID_HERE' with an actual venue_id from the query above
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
  gen_random_uuid(), -- Generates a proper UUID
  'Test Wedding Reception',
  'John and Jane Wedding',
  NOW() + INTERVAL '60 days',
  NULL, -- Will be filled when client confirms
  'YOUR_VENUE_ID_HERE', -- REPLACE THIS with actual venue_id
  'pending_confirmation',
  NOW(),
  NOW()
)
RETURNING event_id; -- This will show you the generated event_id

-- Step 3: Copy the event_id from the result above and use it in the invitation
-- Create the client invitation
-- Replace 'YOUR_EVENT_ID_HERE' with the event_id from step 2
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
  'YOUR_VENUE_ID_HERE', -- REPLACE THIS with the same venue_id from step 2
  'client',
  'pending',
  NOW() + INTERVAL '48 hours',
  jsonb_build_object(
    'name', 'John Smith',
    'phone', '(555) 123-4567',
    'event_id', 'YOUR_EVENT_ID_HERE', -- REPLACE THIS with event_id from step 2
    'event_date', (NOW() + INTERVAL '60 days')::text,
    'venue_name', 'The Grand Ballroom',
    'space_names', ARRAY['Main Ballroom', 'Garden Terrace'],
    'guest_count', 150
  ),
  NOW()
);

-- Step 4: Verify the invitation was created
SELECT
  token,
  invitee_email,
  invitation_type,
  status,
  expires_at,
  metadata
FROM invitations
WHERE token = 'test-client-token-456';
