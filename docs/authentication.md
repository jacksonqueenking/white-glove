# Authentication System

## Overview

The platform uses Supabase Auth with support for both magic link (passwordless) and traditional password authentication. All user types (clients, venues, vendors) use the same authentication system with role-based access control.

---

## Authentication Methods

### Magic Link Authentication (Primary)

**How It Works:**
1. User enters email address
2. System sends magic link to email
3. User clicks link
4. User is authenticated and redirected to dashboard

**Advantages:**
- No password to remember
- More secure (no password to steal)
- Better UX for infrequent users (clients)
- Reduces support burden (no password resets)

**Implementation:**
```typescript
async function sendMagicLink(email: string, userType: 'client' | 'venue' | 'vendor') {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${BASE_URL}/${userType}/dashboard`,
      data: {
        user_type: userType
      }
    }
  });
  
  if (error) throw error;
}
```

### Password Authentication (Alternative)

**How It Works:**
1. User creates account with email + password
2. User logs in with email + password
3. Session created

**When to Use:**
- User prefers traditional login
- Organization requires password auth
- Backup method if magic link fails

**Implementation:**
```typescript
async function signUpWithPassword(
  email: string,
  password: string,
  userType: 'client' | 'venue' | 'vendor',
  additionalData: any
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        user_type: userType,
        ...additionalData
      },
      emailRedirectTo: `${BASE_URL}/${userType}/verify`
    }
  });
  
  if (error) throw error;
  return data;
}

async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  return data;
}
```

---

## User Types and Roles

### Role-Based Access Control

**User Metadata:**
```typescript
interface UserMetadata {
  user_type: 'client' | 'venue' | 'vendor' | 'admin';
  entity_id: string; // ID in respective table (client_id, venue_id, vendor_id)
  name: string;
  onboarding_completed: boolean;
  preferences?: {
    notification_email: boolean;
    notification_sms: boolean;
    two_factor_enabled?: boolean;
  };
}
```

**Stored in Supabase auth.users metadata:**
```sql
SELECT 
  auth.users.id,
  auth.users.email,
  auth.users.raw_user_meta_data->>'user_type' as user_type,
  auth.users.raw_user_meta_data->>'entity_id' as entity_id
FROM auth.users;
```

---

## Registration Flows

### Client Registration

**Triggered by:** Booking confirmation link (see onboarding-flows.md)

```typescript
async function registerClient(confirmationToken: string, authMethod: 'magic' | 'password', password?: string) {
  // 1. Verify confirmation token
  const pendingEvent = await verifyConfirmationToken(confirmationToken);
  
  // 2. Create auth account
  let authUser;
  if (authMethod === 'magic') {
    authUser = await sendMagicLink(pendingEvent.email, 'client');
  } else {
    authUser = await signUpWithPassword(
      pendingEvent.email,
      password!,
      'client',
      { name: pendingEvent.client_name }
    );
  }
  
  // 3. Create client record
  const client = await db.clients.create({
    client_id: authUser.id,
    name: pendingEvent.client_name,
    email: pendingEvent.email,
    phone: pendingEvent.phone,
    // ... other fields from pending event
  });
  
  // 4. Link event to client
  await db.events.update(pendingEvent.event_id, {
    client_id: client.client_id,
    status: 'confirmed'
  });
  
  // 5. Send welcome email
  await sendWelcomeEmail(client);
  
  return { client, authUser };
}
```

### Venue Registration

**Triggered by:** Invitation link (see onboarding-flows.md)

```typescript
async function registerVenue(invitationToken: string, venueData: VenueRegistrationData) {
  // 1. Verify invitation token
  const invitation = await verifyInvitationToken(invitationToken);
  
  // 2. Create auth account
  const authUser = await signUpWithPassword(
    venueData.email,
    venueData.password,
    'venue',
    { name: venueData.name }
  );
  
  // 3. Create venue record
  const venue = await db.venues.create({
    venue_id: authUser.id,
    name: venueData.name,
    email: venueData.email,
    phone: venueData.phone,
    address: venueData.address,
    description: venueData.description,
    // ... other fields
  });
  
  // 4. Mark invitation as used
  await markInvitationUsed(invitationToken);
  
  // 5. Set onboarding status
  await setOnboardingStatus(authUser.id, {
    profile_complete: true,
    spaces_added: false,
    offerings_added: false,
    approved: false
  });
  
  return { venue, authUser };
}
```

### Vendor Registration

**Triggered by:** Venue invitation (see onboarding-flows.md)

```typescript
async function registerVendor(invitationToken: string, vendorData: VendorRegistrationData) {
  // 1. Verify invitation token and get venue_id
  const invitation = await verifyVendorInvitation(invitationToken);
  
  // 2. Create auth account
  const authUser = await signUpWithPassword(
    vendorData.email,
    vendorData.password,
    'vendor',
    { name: vendorData.name }
  );
  
  // 3. Create vendor record
  const vendor = await db.vendors.create({
    vendor_id: authUser.id,
    name: vendorData.name,
    email: vendorData.email,
    phone: vendorData.phone,
    address: vendorData.address,
    description: vendorData.description
  });
  
  // 4. Create VenueVendor relationship
  await db.venue_vendors.create({
    venue_id: invitation.venue_id,
    vendor_id: vendor.vendor_id,
    approval_status: 'pending'
  });
  
  // 5. Mark invitation as used
  await markInvitationUsed(invitationToken);
  
  return { vendor, authUser };
}
```

---

## Session Management

### Session Duration

**Default Settings:**
- Access token TTL: 1 hour
- Refresh token TTL: 30 days (with "Remember Me")
- Refresh token TTL: 7 days (without "Remember Me")

**Implementation:**
```typescript
// Login with Remember Me option
async function signIn(email: string, password: string, rememberMe: boolean) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  
  // Set session persistence
  if (rememberMe) {
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token
    });
  }
  
  return data;
}
```

### Token Refresh

**Automatic refresh:**
```typescript
// Supabase client automatically refreshes tokens
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed');
  }
  if (event === 'SIGNED_OUT') {
    // Redirect to login
    window.location.href = '/login';
  }
});
```

### Session Storage

- **LocalStorage:** For "Remember Me" sessions (persistent)
- **SessionStorage:** For temporary sessions (browser session only)
- **Cookies:** HttpOnly cookies for additional security

---

## Two-Factor Authentication (2FA)

### Availability

**Recommended for:**
- Venues (handle sensitive client data)
- Optional for clients and vendors

**Implementation using Supabase MFA:**
```typescript
// Enable 2FA
async function enable2FA() {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp'
  });
  
  if (error) throw error;
  
  // Show QR code to user
  return {
    qr: data.totp.qr_code,
    secret: data.totp.secret,
    factor_id: data.id
  };
}

// Verify and activate 2FA
async function verify2FA(factorId: string, code: string) {
  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    code
  });
  
  if (error) throw error;
  return data;
}

// Challenge during login
async function challenge2FA(factorId: string, code: string) {
  const { data, error } = await supabase.auth.mfa.challenge({
    factorId
  });
  
  if (error) throw error;
  
  // Verify the code
  const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: data.id,
    code
  });
  
  return verifyData;
}
```

**Setup Flow:**
1. User enables 2FA in settings
2. System generates TOTP secret
3. User scans QR code with authenticator app
4. User enters verification code
5. 2FA activated
6. Backup codes generated and shown (user must save)

**Login Flow with 2FA:**
1. User enters email/password or clicks magic link
2. System detects 2FA is enabled
3. User prompted for 2FA code
4. User enters code from authenticator app
5. Code verified, user logged in

---

## Password Management

### Password Requirements

```typescript
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");
```

**Requirements:**
- Minimum 8 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number
- At least one special character

### Password Reset

**Via Magic Link (Recommended):**
```typescript
async function resetPasswordMagicLink(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${BASE_URL}/reset-password`
  });
  
  if (error) throw error;
}
```

**User Flow:**
1. User clicks "Forgot Password"
2. Enters email
3. Receives magic link via email
4. Clicks link → Taken to password reset page
5. Enters new password
6. Password updated, user logged in

**Reset Page:**
```typescript
async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
  
  if (error) throw error;
}
```

---

## Email Verification

### Initial Email Verification

**For password signups:**
```typescript
// Automatically sent by Supabase on signup
// Custom template can be configured in Supabase dashboard
```

**Email Template:**
```
Subject: Verify your email - EventPlatform

Hi [Name],

Welcome to EventPlatform! Please verify your email address by clicking the link below:

[Verify Email Button]

This link will expire in 24 hours.

If you didn't create this account, you can safely ignore this email.

Thanks,
The EventPlatform Team
```

**Verification Flow:**
1. User signs up with email/password
2. Verification email sent automatically
3. User must verify before full access
4. Unverified users see banner: "Please verify your email"
5. Can resend verification email if needed

---

## Security Measures

### Rate Limiting

**Login Attempts:**
```typescript
// Using Redis for rate limiting
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60; // 15 minutes

async function checkLoginAttempts(email: string): Promise<boolean> {
  const key = `login_attempts:${email}`;
  const attempts = await redis.get(key);
  
  if (attempts && parseInt(attempts) >= MAX_LOGIN_ATTEMPTS) {
    return false; // Account locked
  }
  
  return true; // Can attempt login
}

async function recordLoginAttempt(email: string, success: boolean) {
  const key = `login_attempts:${email}`;
  
  if (success) {
    // Reset on successful login
    await redis.del(key);
  } else {
    // Increment failed attempts
    const attempts = await redis.incr(key);
    if (attempts === 1) {
      // Set expiry on first attempt
      await redis.expire(key, LOCKOUT_DURATION);
    }
  }
}
```

**Magic Link Requests:**
```typescript
// Limit magic link requests
const MAX_MAGIC_LINK_REQUESTS = 3;
const MAGIC_LINK_WINDOW = 60 * 60; // 1 hour

async function canRequestMagicLink(email: string): Promise<boolean> {
  const key = `magic_link_requests:${email}`;
  const requests = await redis.get(key);
  
  if (requests && parseInt(requests) >= MAX_MAGIC_LINK_REQUESTS) {
    return false;
  }
  
  await redis.incr(key);
  await redis.expire(key, MAGIC_LINK_WINDOW);
  return true;
}
```

### Session Security

**Security Headers:**
```typescript
// In Next.js middleware
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  return response;
}
```

**CSRF Protection:**
- Supabase handles CSRF tokens automatically
- Double Submit Cookie pattern
- SameSite cookie attribute

### Sensitive Actions

**Require Re-authentication for:**
- Changing email
- Changing password
- Enabling/disabling 2FA
- Viewing payment information
- Deleting account

```typescript
async function requireRecentAuth(maxAge: number = 5 * 60 * 1000) {
  const session = await supabase.auth.getSession();
  
  if (!session.data.session) {
    throw new Error('Not authenticated');
  }
  
  const lastSignIn = new Date(session.data.session.user.last_sign_in_at || 0);
  const now = new Date();
  
  if (now.getTime() - lastSignIn.getTime() > maxAge) {
    // Require re-authentication
    throw new ReAuthRequiredError('Please sign in again to continue');
  }
}
```

---

## Account Recovery

### Account Lockout

**After failed login attempts:**
1. Account locked for 15 minutes
2. User receives email notification
3. Can recover via magic link
4. Or wait for lockout period to expire

### Compromised Account

**User-initiated:**
1. User clicks "I think my account was compromised"
2. Immediate logout from all sessions
3. Password reset required
4. All active sessions invalidated
5. User notified via email

**Admin-initiated:**
1. Admin can lock account
2. User notified
3. Must contact support to unlock

---

## Logout

### Single Device Logout

```typescript
async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  
  // Clear local state
  localStorage.clear();
  sessionStorage.clear();
  
  // Redirect to login
  window.location.href = '/login';
}
```

### Logout All Devices

```typescript
async function logoutAllDevices() {
  // Invalidate all refresh tokens
  const { error } = await supabase.auth.signOut({ scope: 'global' });
  if (error) throw error;
  
  // User will be logged out on all devices
}
```

---

## Audit Logging

### Authentication Events to Log

```typescript
interface AuthAuditLog {
  user_id: string;
  event_type: 'login' | 'logout' | 'password_change' | 'password_reset' | 
              '2fa_enabled' | '2fa_disabled' | 'email_changed' | 'failed_login';
  ip_address: string;
  user_agent: string;
  timestamp: datetime;
  metadata?: any;
}
```

**Log:**
- Successful logins
- Failed login attempts
- Password changes
- Password resets
- 2FA enable/disable
- Email changes
- Account lockouts
- Suspicious activity

---

## Testing Authentication

### Test Users

```typescript
// Create test users for development
const testUsers = {
  client: {
    email: 'test-client@example.com',
    password: 'TestClient123!',
    type: 'client'
  },
  venue: {
    email: 'test-venue@example.com',
    password: 'TestVenue123!',
    type: 'venue'
  },
  vendor: {
    email: 'test-vendor@example.com',
    password: 'TestVendor123!',
    type: 'vendor'
  }
};
```

### Unit Tests

```typescript
describe('Authentication', () => {
  it('should create user with password', async () => {
    // Test password signup
  });
  
  it('should send magic link', async () => {
    // Test magic link sending
  });
  
  it('should enforce password requirements', async () => {
    // Test password validation
  });
  
  it('should lock account after failed attempts', async () => {
    // Test rate limiting
  });
  
  it('should enable 2FA', async () => {
    // Test 2FA enrollment
  });
});
```

---

## Future Enhancements

**v1.1+:**
- Social login (Google, Apple)
- Biometric authentication (fingerprint, Face ID)
- WebAuthn/Passkeys
- SMS-based 2FA (in addition to TOTP)
- Device trust/recognition
- IP allowlisting for venues
- SSO for enterprise venues