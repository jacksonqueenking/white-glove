-- Cleanup Test Data
-- Run this to remove test invitations and start fresh
-- This is safe to run - it only removes test data

-- Delete test invitation
DELETE FROM invitations WHERE token = 'test-client-token-456';

-- Delete test events (optional - uncomment if you want to remove them)
-- DELETE FROM events WHERE name LIKE '%Smith & Johnson%' OR name LIKE 'Test%';

-- Verify deletion
SELECT COUNT(*) as remaining_test_invitations
FROM invitations
WHERE token LIKE 'test-%';

-- Show what's left
SELECT token, invitee_email, invitation_type, status
FROM invitations
WHERE token LIKE 'test-%';
