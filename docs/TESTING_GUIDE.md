# White Glove Authentication & Onboarding Testing Guide

This guide provides comprehensive instructions for testing all authentication and onboarding flows in the White Glove event management platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Testing Methodology](#testing-methodology)
4. [Authentication Flow Tests](#authentication-flow-tests)
5. [Onboarding Flow Tests](#onboarding-flow-tests)
6. [Rate Limiting Tests](#rate-limiting-tests)
7. [Integration Tests](#integration-tests)
8. [Manual Testing Checklist](#manual-testing-checklist)
9. [Automated Testing](#automated-testing)

---

## Prerequisites

Before testing, ensure you have:

- ✅ Supabase project set up with the schema deployed
- ✅ Environment variables configured (see `.env.local.example`)
- ✅ Redis instance (Upstash) configured for rate limiting
- ✅ Supabase email templates configured
- ✅ Application running locally (`npm run dev`)

## Environment Setup

### Required Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Redis (Upstash) - Optional but recommended for rate limiting
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

### Supabase Email Templates

Configure these templates in your Supabase dashboard under **Authentication > Email Templates**:

1. **Magic Link** - Used for passwordless authentication
2. **Confirm Signup** - Used for email verification after password signup
3. **Reset Password** - Used for password reset flow

---

## Testing Methodology

### Testing Levels

1. **Unit Tests** - Test individual functions and components
2. **API Tests** - Test API endpoints directly
3. **Integration Tests** - Test complete flows end-to-end
4. **Manual Tests** - Test user experience in browser

### Test Data

Use test email addresses that you can access. For Supabase local development, you can use:
- `test+client@example.com`
- `test+venue@example.com`
- `test+vendor@example.com`

---

## Authentication Flow Tests

### 1. Magic Link Authentication

#### Test Case: Successful Magic Link Login

**Steps:**
1. Navigate to `/login`
2. Enter email: `test+client@example.com`
3. Click "Send Magic Link"
4. Check email inbox
5. Click the magic link in the email
6. Verify redirect to `/client/dashboard`

**Expected Results:**
- ✅ Success message displayed: "Check your email for the magic link!"
- ✅ Email received within 30 seconds
- ✅ Magic link redirects to dashboard
- ✅ User is authenticated (session created)
- ✅ Rate limit headers present in response

**API Test:**
```bash
curl -X POST http://localhost:3000/api/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "userType": "client",
    "redirectTo": "/client/dashboard"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Magic link sent! Check your email.",
  "email": "test@example.com"
}
```

#### Test Case: Rate Limit Exceeded

**Steps:**
1. Send 11 magic link requests within 1 hour (limit is 10)
2. Observe 11th request response

**Expected Results:**
- ✅ Status code: 429 (Too Many Requests)
- ✅ Error message: "Too many requests. Please try again later."
- ✅ Headers include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

### 2. Password Authentication

#### Test Case: Successful Signup

**Steps:**
1. Navigate to `/signup?type=client`
2. Fill in the form:
   - Name: "John Doe"
   - Email: "test+signup@example.com"
   - Password: "SecurePass123!"
   - Confirm Password: "SecurePass123!"
3. Click "Create Account"
4. Check email for verification link
5. Click verification link
6. Log in with credentials

**Expected Results:**
- ✅ Account created successfully
- ✅ Verification email sent
- ✅ User redirected to login page
- ✅ Password meets requirements (8+ chars, uppercase, lowercase, number, special char)
- ✅ User record created in `auth.users` and `clients` table

**API Test:**
```bash
curl -X POST 'http://localhost:3000/api/auth/password?action=signup' \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test+signup@example.com",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!",
    "name": "John Doe",
    "userType": "client"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "test+signup@example.com",
    "user_metadata": {
      "user_type": "client",
      "name": "John Doe"
    }
  },
  "message": "Account created successfully. Please check your email to verify."
}
```

#### Test Case: Successful Login

**Steps:**
1. Navigate to `/login`
2. Click "Sign In with Password"
3. Enter email and password
4. Click "Sign In"

**Expected Results:**
- ✅ User authenticated
- ✅ Redirect to appropriate dashboard based on user type
- ✅ Session created (check cookies)
- ✅ User metadata correct

**API Test:**
```bash
curl -X POST 'http://localhost:3000/api/auth/password?action=login' \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

#### Test Case: Invalid Password

**Steps:**
1. Attempt login with wrong password

**Expected Results:**
- ✅ Status code: 401
- ✅ Error message displayed
- ✅ No session created
- ✅ Rate limit counter incremented

---

### 3. Password Reset Flow

#### Test Case: Request Password Reset

**Steps:**
1. Navigate to `/login`
2. Click "Forgot password?"
3. Enter email address
4. Submit form
5. Check email for reset link
6. Click reset link
7. Enter new password
8. Confirm password change

**Expected Results:**
- ✅ Reset email sent (even if email doesn't exist - security)
- ✅ Reset link valid for limited time
- ✅ Password successfully updated
- ✅ Can log in with new password
- ✅ Old password no longer works

**API Test - Request Reset:**
```bash
curl -X POST 'http://localhost:3000/api/auth/reset-password?action=request' \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**API Test - Complete Reset:**
```bash
curl -X POST 'http://localhost:3000/api/auth/reset-password?action=reset' \
  -H "Content-Type: application/json" \
  -d '{
    "password": "NewSecurePass123!",
    "confirmPassword": "NewSecurePass123!"
  }'
```

#### Test Case: Rate Limit on Password Reset

**Steps:**
1. Request password reset 4 times within 1 hour (limit is 3)

**Expected Results:**
- ✅ 4th request returns 429 status
- ✅ Rate limit headers present

---

### 4. Logout Flow

**Steps:**
1. Authenticate as any user type
2. Navigate to logout endpoint or click logout button
3. Verify session cleared

**API Test:**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Cookie: your-session-cookie"
```

**Expected Results:**
- ✅ Session cleared
- ✅ Cookies removed
- ✅ Redirect to login page
- ✅ Cannot access protected routes

---

## Onboarding Flow Tests

### 1. Client Onboarding

#### Test Case: Client Confirmation via Email Link

**Flow:**
1. Venue sends inquiry to client
2. Client receives email with confirmation link containing token
3. Client clicks link → navigates to `/client/confirm/[token]`
4. Client reviews event details
5. Client creates account or logs in
6. Client confirms interest
7. Client redirected to event page

**API Test:**
```bash
# First, create an invitation (as venue admin via Supabase)
# Then test the onboarding endpoint

curl -X POST http://localhost:3000/api/onboarding/client \
  -H "Content-Type: application/json" \
  -d '{
    "token": "invitation-token-here",
    "name": "Jane Client",
    "email": "jane@example.com",
    "password": "SecurePass123!",
    "phone": "+1234567890"
  }'
```

**Expected Results:**
- ✅ Token validated successfully
- ✅ Token not expired
- ✅ User account created
- ✅ Client record created in database
- ✅ Event association created
- ✅ Token marked as "used"
- ✅ Cannot reuse same token

**Database Verification:**
```sql
-- Check client created
SELECT * FROM clients WHERE email = 'jane@example.com';

-- Check auth user created
SELECT * FROM auth.users WHERE email = 'jane@example.com';

-- Check invitation marked as used
SELECT status, used_at FROM invitations WHERE token = 'invitation-token-here';
```

---

### 2. Venue Onboarding

#### Test Case: Venue Registration via Invitation

**Flow:**
1. Admin/platform sends venue invitation email
2. Venue rep clicks invitation link → `/venue/register/[token]`
3. Multi-step form completion:
   - Step 1: Venue details (name, contact)
   - Step 2: Address information
   - Step 3: Account creation (email, password)
   - Step 4: Additional details
4. Submit registration
5. Venue redirected to dashboard

**API Test:**
```bash
curl -X POST http://localhost:3000/api/onboarding/venue \
  -H "Content-Type: application/json" \
  -d '{
    "token": "venue-invitation-token",
    "name": "Grand Ballroom Venue",
    "email": "venue@example.com",
    "password": "SecurePass123!",
    "phone": "+1234567890",
    "contactName": "John Manager",
    "street": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94102",
    "description": "Elegant event space in downtown SF"
  }'
```

**Expected Results:**
- ✅ Invitation validated
- ✅ Venue auth account created
- ✅ Venue record created
- ✅ Invitation marked as accepted
- ✅ User has `user_type: 'venue'` in metadata

**Database Verification:**
```sql
-- Check venue created
SELECT * FROM venues WHERE email = 'venue@example.com';

-- Check venue has proper address JSONB
SELECT address FROM venues WHERE email = 'venue@example.com';
```

---

### 3. Vendor Onboarding

#### Test Case: Vendor Registration via Venue Invitation

**Flow:**
1. Venue invites vendor (caterer, photographer, etc.)
2. Vendor receives email with invitation link
3. Vendor clicks link → `/vendor/register/[token]`
4. Vendor completes registration form:
   - Business name
   - Contact information
   - Services offered
   - COI upload (Certificate of Insurance)
5. Submit registration
6. VenueVendor relationship created (status: pending)
7. Vendor redirected to dashboard

**API Test:**
```bash
curl -X POST http://localhost:3000/api/onboarding/vendor \
  -H "Content-Type: application/json" \
  -d '{
    "token": "vendor-invitation-token",
    "name": "Delicious Catering Co",
    "email": "vendor@example.com",
    "password": "SecurePass123!",
    "phone": "+1234567890",
    "contactName": "Chef Mike",
    "street": "456 Food Ave",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94103",
    "description": "Premium catering services"
  }'
```

**Expected Results:**
- ✅ Invitation validated
- ✅ Contains `venue_id` in invitation metadata
- ✅ Vendor auth account created
- ✅ Vendor record created
- ✅ VenueVendor relationship created
- ✅ Approval status initially "pending"
- ✅ Invitation marked as accepted

**Database Verification:**
```sql
-- Check vendor created
SELECT * FROM vendors WHERE email = 'vendor@example.com';

-- Check venue-vendor relationship
SELECT * FROM venue_vendors
WHERE vendor_id = (SELECT vendor_id FROM vendors WHERE email = 'vendor@example.com');

-- Check approval status
SELECT approval_status FROM venue_vendors
WHERE vendor_id = (SELECT vendor_id FROM vendors WHERE email = 'vendor@example.com');
```

---

## Rate Limiting Tests

### Rate Limit Configuration

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| `/api/auth/magic-link` | 10 requests | 1 hour | Prevent magic link spam |
| `/api/auth/password?action=login` | 5 requests | 15 minutes | Prevent brute force |
| `/api/auth/password?action=signup` | 3 requests | 24 hours | Prevent fake accounts |
| `/api/auth/reset-password?action=request` | 3 requests | 1 hour | Prevent reset spam |

### Test Case: Verify Rate Limit Headers

**Steps:**
1. Make any auth API request
2. Inspect response headers

**Expected Headers:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1678901234
```

### Test Case: Rate Limit Recovery

**Steps:**
1. Hit rate limit for an endpoint
2. Wait for reset time to pass
3. Try request again

**Expected Results:**
- ✅ After reset time, requests succeed again
- ✅ `X-RateLimit-Remaining` resets to limit value

---

## Integration Tests

### Full User Journey Test

#### Test Case: Client Journey from Invitation to Event Management

**Flow:**
1. ✅ Venue creates event inquiry
2. ✅ System generates invitation for client
3. ✅ Client receives email
4. ✅ Client clicks confirmation link
5. ✅ Client creates account
6. ✅ Client confirms event
7. ✅ Client accesses event dashboard
8. ✅ Client can view event details
9. ✅ Client can manage guests
10. ✅ Client can review contract

#### Test Case: Multi-User Event Planning

**Flow:**
1. ✅ Client confirms event
2. ✅ Venue invites 3 vendors (caterer, photographer, florist)
3. ✅ All vendors complete onboarding
4. ✅ Vendors appear in venue dashboard
5. ✅ Venue approves vendors
6. ✅ Vendors receive approval notification
7. ✅ Vendors can access event details

---

## Manual Testing Checklist

### Pre-Deployment Checklist

- [ ] All auth flows work in production environment
- [ ] Email templates properly configured
- [ ] Rate limiting active and working
- [ ] Redis connected (or graceful fallback working)
- [ ] All user types can sign up
- [ ] All user types can log in
- [ ] Password reset works
- [ ] Magic links work
- [ ] Invitations can be created
- [ ] Invitations can be accepted
- [ ] Expired invitations properly rejected
- [ ] Used invitations cannot be reused
- [ ] Rate limits prevent abuse
- [ ] Error messages are user-friendly
- [ ] Security headers present
- [ ] Sessions properly managed
- [ ] Logout works correctly

### Browser Testing

Test in these browsers:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Proper ARIA labels
- [ ] Form validation messages accessible
- [ ] Error states clearly communicated

---

## Automated Testing

### Setting Up Testing Environment

```bash
# Install testing dependencies
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom

# Create test environment file
cp .env.local .env.test
```

### Example Test: Auth API

```typescript
// __tests__/api/auth/magic-link.test.ts
import { describe, it, expect } from 'vitest';

describe('POST /api/auth/magic-link', () => {
  it('should send magic link successfully', async () => {
    const response = await fetch('http://localhost:3000/api/auth/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        userType: 'client',
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.email).toBe('test@example.com');
  });

  it('should reject invalid email', async () => {
    const response = await fetch('http://localhost:3000/api/auth/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'invalid-email',
        userType: 'client',
      }),
    });

    expect(response.status).toBe(400);
  });

  it('should enforce rate limits', async () => {
    // Send 11 requests rapidly
    const requests = Array.from({ length: 11 }, () =>
      fetch('http://localhost:3000/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          userType: 'client',
        }),
      })
    );

    const responses = await Promise.all(requests);
    const lastResponse = responses[responses.length - 1];

    expect(lastResponse.status).toBe(429);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- auth/magic-link.test.ts

# Run with coverage
npm test -- --coverage
```

---

## Troubleshooting

### Common Issues

#### Issue: Magic Link Not Received

**Possible Causes:**
- Email template not configured in Supabase
- SMTP settings incorrect
- Email in spam folder
- Rate limit exceeded

**Solution:**
1. Check Supabase email template configuration
2. Check rate limit headers
3. Verify email address is correct
4. Check spam/junk folder

#### Issue: Rate Limit Always Returning 429

**Possible Causes:**
- Redis not clearing old keys
- Clock skew between servers

**Solution:**
1. Check Redis connection
2. Verify Redis keys are expiring
3. Clear Redis cache manually if needed

#### Issue: Invitation Token Invalid

**Possible Causes:**
- Token expired
- Token already used
- Token doesn't exist

**Solution:**
1. Check `invitations` table for token
2. Verify `expires_at` timestamp
3. Check `status` field (should be 'pending')

---

## Test Data Cleanup

After testing, clean up test data:

```sql
-- Delete test users
DELETE FROM auth.users WHERE email LIKE 'test%@example.com';

-- Delete test clients
DELETE FROM clients WHERE email LIKE 'test%@example.com';

-- Delete test venues
DELETE FROM venues WHERE email LIKE 'test%@example.com';

-- Delete test vendors
DELETE FROM vendors WHERE email LIKE 'test%@example.com';

-- Delete test invitations
DELETE FROM invitations WHERE invitee_email LIKE 'test%@example.com';

-- Clear Redis (if needed)
-- Run: FLUSHALL in Redis CLI or restart Redis
```

---

## Summary

This testing guide covers:
- ✅ All authentication methods (magic link, password)
- ✅ All onboarding flows (client, venue, vendor)
- ✅ Rate limiting validation
- ✅ Integration testing
- ✅ Manual testing checklists
- ✅ Automated testing examples

Following this guide ensures that your authentication and onboarding system is robust, secure, and user-friendly.
