# Testing the Onboarding Flows

## Quick Start Guide

### Step 1: Test Venue Onboarding (Do this first!)

Run this SQL in your Supabase SQL Editor:

```sql
-- From: seeds/create-test-venue-invitation.sql
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
  '00000000-0000-0000-0000-000000000000',
  'venue',
  'pending',
  NOW() + INTERVAL '7 days',
  '{}'::jsonb,
  NOW()
);
```

Then navigate to: **http://localhost:3000/venue/register/test-venue-token-123**

Complete all 5 steps:
- Step 1: Basic info
- Step 2: Location
- Step 3: Add at least 1 space
- Step 4: Add at least 3 offerings
- Step 5: Review and submit

### Step 2: Test Client Onboarding

Run this SQL (it will automatically use the venue you just created):

```sql
-- From: seeds/create-test-client-invitation-simple.sql
-- Copy and paste the entire contents of that file
```

Or use the manual version from [seeds/create-test-client-invitation-simple.sql](seeds/create-test-client-invitation-simple.sql)

Then navigate to: **http://localhost:3000/client/confirm/test-client-token-456**

Test both authentication methods:
- Magic link (will send email notification)
- Password (creates account immediately)

### Step 3: Test Vendor Onboarding

Run this SQL:

```sql
-- From: seeds/create-test-vendor-invitation.sql
-- Copy and paste the entire contents of that file
```

Or use the manual version from [seeds/create-test-vendor-invitation.sql](seeds/create-test-vendor-invitation.sql)

Then navigate to: **http://localhost:3000/vendor/register/test-vendor-token-789**

Complete the registration form.

---

## SQL Test Files Reference

All test SQL files are in the `seeds/` directory:

| File | Purpose | Use When |
|------|---------|----------|
| [create-test-venue-invitation.sql](seeds/create-test-venue-invitation.sql) | Simple venue invitation | Testing venue onboarding |
| [create-test-client-invitation-simple.sql](seeds/create-test-client-invitation-simple.sql) | Auto-creates event + invitation | Testing client onboarding |
| [create-test-vendor-invitation.sql](seeds/create-test-vendor-invitation.sql) | Auto-uses existing venue | Testing vendor onboarding |
| [test-invitations.sql](seeds/test-invitations.sql) | All-in-one reference | View all options |

---

## Verification Queries

After testing, verify everything was created correctly:

### Check Venue Registration

```sql
-- User created
SELECT id, email, raw_user_meta_data->>'user_type' as user_type
FROM auth.users
WHERE email = 'newvenue@example.com';

-- Venue record
SELECT venue_id, name, description
FROM venues
WHERE name LIKE '%'; -- Replace with your venue name

-- Spaces created
SELECT space_id, name, capacity
FROM spaces
WHERE venue_id = (SELECT venue_id FROM venues LIMIT 1);

-- Vendor record created (venue as vendor)
SELECT vendor_id, name
FROM vendors
WHERE vendor_id = (SELECT venue_id FROM venues LIMIT 1);

-- Venue-vendor relationship
SELECT venue_id, vendor_id, approval_status
FROM venue_vendors
WHERE venue_id = (SELECT venue_id FROM venues LIMIT 1);

-- Offerings created
SELECT e.element_id, e.name, e.category, e.price
FROM elements e
JOIN venue_vendors vv ON e.venue_vendor_id = vv.venue_vendor_id
WHERE vv.venue_id = (SELECT venue_id FROM venues LIMIT 1);
```

### Check Client Registration

```sql
-- Client user
SELECT id, email
FROM auth.users
WHERE email = 'newclient@example.com';

-- Client record
SELECT client_id, name, email
FROM clients
WHERE email = 'newclient@example.com';

-- Event updated with client
SELECT event_id, name, client_id, status
FROM events
WHERE client_id = (SELECT client_id FROM clients WHERE email = 'newclient@example.com');
```

### Check Vendor Registration

```sql
-- Vendor user
SELECT id, email
FROM auth.users
WHERE email = 'newvendor@example.com';

-- Vendor record
SELECT vendor_id, name, email
FROM vendors
WHERE email = 'newvendor@example.com';

-- Venue-vendor relationship
SELECT venue_id, vendor_id, approval_status
FROM venue_vendors
WHERE vendor_id = (SELECT vendor_id FROM vendors WHERE email = 'newvendor@example.com');
```

---

## Cleanup (Start Fresh)

To remove all test data and start over:

```sql
-- Delete test invitations
DELETE FROM invitations WHERE token LIKE 'test-%';

-- Delete test events
DELETE FROM events WHERE name LIKE 'Test%';

-- Delete test clients
DELETE FROM clients WHERE email LIKE '%@example.com';

-- Delete test venues (this will cascade to spaces, vendor records, etc.)
DELETE FROM venues WHERE name LIKE '%Test%' OR email LIKE '%@example.com';

-- Delete test vendors
DELETE FROM vendors WHERE email LIKE '%@example.com';

-- Delete test auth users
-- BE CAREFUL: This will delete the actual user accounts
DELETE FROM auth.users WHERE email LIKE '%@example.com';
```

---

## Common Issues

### Issue: "Invalid or expired invitation"
**Solution:** Make sure you ran the SQL to create the invitation first.

### Issue: "Foreign key constraint violation"
**Solution:** This was fixed! Make sure you're using the latest code.

### Issue: UUID syntax error
**Solution:** Use `gen_random_uuid()` instead of string UUIDs like `'test-event-123'`.

### Issue: "No venues found"
**Solution:** Run the venue onboarding test first before testing client/vendor flows.

---

## Success Criteria

✅ **Venue Onboarding Complete When:**
- User can complete all 5 steps
- Venue record exists in database
- Spaces are created
- Vendor record exists (venue as vendor)
- Offerings are created
- User is redirected to `/venue/dashboard`

✅ **Client Onboarding Complete When:**
- User can see event details
- Both auth methods work (magic link + password)
- Client record is created
- Event status updates to `confirmed`
- User is redirected to event page

✅ **Vendor Onboarding Complete When:**
- User can complete registration form
- Vendor record is created
- Venue-vendor relationship created with `pending` status
- User is redirected to `/vendor/dashboard`
