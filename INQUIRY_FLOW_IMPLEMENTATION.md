# Client Inquiry Flow Implementation

## Overview

This document describes the complete implementation of the client inquiry flow, which allows potential clients to request bookings at venues before creating an account. The flow follows the onboarding process described in [docs/onboarding-flows.md](docs/onboarding-flows.md).

## Flow Summary

1. **Client submits inquiry** → Client fills out a public form on the venue's booking page
2. **Venue receives task** → A task is created for the venue to review the inquiry
3. **Venue approves/declines** → Venue reviews inquiry details and makes a decision
4. **If approved**: Event created, invitation sent to client via email
5. **Client confirms** → Client clicks link in email and creates account
6. **Account created** → Client can now access their event and start planning

## Implementation Components

### 1. Database Schema

**File**: `supabase/migrations/20250124000000_client_inquiries.sql`

Created `client_inquiries` table to store pre-account booking requests:

```sql
CREATE TABLE client_inquiries (
  inquiry_id UUID PRIMARY KEY,
  venue_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  space_ids UUID[] NOT NULL,
  guest_count INTEGER NOT NULL,
  budget DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL, -- 'pending', 'approved', 'declined', 'expired'
  -- ... additional fields for tracking and metadata
);
```

**Key Features**:
- Anonymous inserts allowed (public form submission)
- RLS policies for venues to view/update their own inquiries
- Helper function `check_space_availability()` to validate date conflicts
- Tracks invitation tokens and expiry

### 2. API Endpoints

#### a. Submit Inquiry: `POST /api/inquiries`

**File**: `app/api/inquiries/route.ts`

Handles public form submissions:
- Validates all form data using Zod schema
- Verifies venue and spaces exist
- Checks space availability for the requested date
- Creates inquiry record
- Creates a task for the venue
- Returns reference number to client

**Request Body**:
```typescript
{
  venue_id: string,
  client_name: string,
  client_email: string,
  client_phone: string,
  event_date: string,
  event_time: string,
  space_ids: string[],
  guest_count: number,
  budget: number,
  description: string,
  // ... optional fields
}
```

**Response**:
```typescript
{
  success: true,
  inquiry_id: string,
  reference_number: string,
  venue_name: string,
  space_available: boolean
}
```

#### b. Get Inquiries: `GET /api/inquiries?venue_id=xxx&status=pending`

Allows venues to fetch their inquiries (used internally, mainly for reference).

#### c. Approve/Decline Inquiry: `POST /api/inquiries/[inquiryId]/approve`

**File**: `app/api/inquiries/[inquiryId]/approve/route.ts`

Handles venue's decision:

**For Approval**:
1. Creates event record with status `pending_confirmation`
2. Links spaces to event
3. Generates secure invitation token
4. Creates invitation record with 48-hour expiry
5. Updates inquiry status to `approved`
6. TODO: Sends confirmation email to client

**For Decline**:
1. Updates inquiry status to `declined`
2. Stores decline reason
3. Optionally stores alternative date suggestions
4. TODO: Sends decline email to client

**Request Body**:
```typescript
{
  decision: 'approve' | 'decline',
  venue_notes?: string,  // For approval
  decline_reason?: string,  // For decline
  alternative_dates?: Array<{date, time, notes}>  // Optional for decline
}
```

#### d. Public Venue Info: `GET /api/public/venues/[venueSlug]`

**File**: `app/api/public/venues/[venueSlug]/route.ts`

Returns venue information and available spaces for the public booking form.

**Note**: Currently uses `venue_id` as the slug. In production, you should add a `slug` field to the venues table.

### 3. Client-Facing Pages

#### a. Booking Inquiry Form: `/book/[venueSlug]`

**File**: `app/book/[venueSlug]/page.tsx`

Public booking form that allows potential clients to submit inquiries:

**Features**:
- Loads venue and spaces information
- Validates all inputs client-side
- Shows space selection with images
- Displays success confirmation with reference number
- Mobile-responsive design
- Shows availability warnings if spaces are booked

**Form Fields**:
- Contact: Name, Email, Phone, Company (optional)
- Event: Date, Time, Type (optional), Spaces (multi-select)
- Details: Guest Count, Budget, Description
- Preferences: Preferred contact method

**Success State**:
- Shows reference number
- Confirms submission
- Explains next steps
- Warns if space availability is uncertain

#### b. Client Confirmation: `/auth/client/confirm/[token]`

**File**: `app/(auth)/client/confirm/[token]/page.tsx`

This page already exists and handles client account creation after venue approval.

**Features**:
- Displays event details from invitation
- Supports both magic link and password auth
- Pre-fills email from invitation
- Creates client account
- Links account to event
- Changes event status to `confirmed`

### 4. Venue-Facing Pages

#### a. Updated Tasks Page: `/venue/tasks`

**File**: `app/venue/tasks/page.tsx`

Enhanced to handle inquiry review tasks:

**Features**:
- Fetches tasks from database
- Detects inquiry review tasks (by form_schema)
- Loads full inquiry details when clicked
- Opens inquiry review modal
- Updates task status after approval/decline

**Changes**:
- Now fetches real tasks from Supabase
- Handles task completion
- Integrates with InquiryReviewModal

#### b. Inquiry Review Modal

**File**: `components/tasks/InquiryReviewModal.tsx`

Beautiful modal component for reviewing inquiries:

**Sections**:
1. **Client Information**: Name, email, phone, company, contact preference
2. **Event Details**: Date/time, type, guest count, budget, spaces
3. **Event Description**: Full client description
4. **Decision Section**: Approve or Decline with forms

**Approval Flow**:
- Optional notes for client
- Confirms and creates event + invitation

**Decline Flow**:
- Required decline reason
- Optional alternative date suggestions (dynamic list)
- Sends decline notification

**UI/UX**:
- Color-coded sections (info in different background colors)
- Smooth state transitions
- Validation before submission
- Loading states during API calls

### 5. Existing Integration Points

The implementation integrates with existing systems:

#### a. Invitations System

Uses the existing `invitations` table and API:
- `GET /api/invitations/[token]` - Already implemented
- Invitation type: `'client'`
- Metadata includes: event_id, name, phone, venue_name, etc.

#### b. Client Onboarding

Uses existing endpoint:
- `POST /api/onboarding/client` - Already implemented
- Handles both magic link and password auth
- Creates client record
- Links client to event
- Updates event status

#### c. Tasks System

Leverages existing task infrastructure:
- Creates dynamic form tasks
- Uses form_schema for inquiry review
- Stores responses in form_response

## Database Relations

```
client_inquiries
  └─> venue (venue_id)
  └─> spaces[] (space_ids array)
  └─> event (event_id, after approval)
  └─> invitation (invitation_token)

When approved:
  inquiry → event (created)
         → event_spaces (linked)
         → invitation (created)

When client confirms:
  invitation → client (created)
           → event.client_id (updated)
           → event.status = 'confirmed'
```

## Email Notifications (TODO)

The following email notifications should be implemented:

### 1. Inquiry Received (to Venue)
- Sent when client submits inquiry
- Includes inquiry details
- Link to tasks page

### 2. Inquiry Approved (to Client)
- Sent when venue approves
- Event details
- Venue notes (if any)
- Link to create account (with token)
- 48-hour expiry warning

### 3. Inquiry Declined (to Client)
- Sent when venue declines
- Decline reason
- Alternative dates (if suggested)
- Apology and encouragement to try other dates

### 4. Reminder (to Client)
- Sent 24 hours before invitation expires
- Reminds to create account
- Link to confirmation page

## Security Considerations

1. **Anonymous Form Submission**: Allowed via RLS policy, but with validation
2. **Rate Limiting**: Should be added to prevent spam (TODO)
3. **Email Verification**: Invitation link serves as email verification
4. **Token Security**: Crypto-random 32-byte tokens, 48-hour expiry
5. **SQL Injection**: Prevented via Supabase parameterized queries
6. **XSS**: Prevented via React's automatic escaping

## Testing Checklist

### End-to-End Flow Test

- [ ] Run database migration
- [ ] Create a test venue with spaces
- [ ] Navigate to `/book/[venue-id]`
- [ ] Fill out and submit inquiry form
- [ ] Verify task appears in venue's task list (`/venue/tasks`)
- [ ] Click task and review inquiry in modal
- [ ] Approve inquiry with notes
- [ ] Verify event is created with status `pending_confirmation`
- [ ] Verify invitation is created
- [ ] Navigate to `/auth/client/confirm/[token]`
- [ ] Create account (test both magic link and password)
- [ ] Verify client record is created
- [ ] Verify event.client_id is updated
- [ ] Verify event.status changes to `confirmed`
- [ ] Verify client can access event

### Decline Flow Test

- [ ] Submit new inquiry
- [ ] Decline with reason and alternative dates
- [ ] Verify inquiry status changes to `declined`
- [ ] Verify decline details are stored

### Edge Cases

- [ ] Expired invitation (past 48 hours)
- [ ] Already used invitation
- [ ] Invalid venue ID
- [ ] Invalid space IDs
- [ ] Space conflict (same space, same date)
- [ ] Duplicate form submission
- [ ] Missing required fields
- [ ] Invalid email format
- [ ] Invalid phone format
- [ ] Invalid date (past date)

## Next Steps / Future Enhancements

1. **Email Integration**
   - Set up email service (SendGrid, Postmark, etc.)
   - Create email templates
   - Implement notification sending

2. **Venue Slug System**
   - Add `slug` field to venues table
   - Generate human-readable slugs (e.g., `golden-gardens-ballroom`)
   - Update public venue endpoint

3. **Rate Limiting**
   - Add Redis-based rate limiting
   - Limit inquiries per IP/email
   - Prevent spam

4. **Analytics**
   - Track inquiry conversion rates
   - Venue response times
   - Popular time slots

5. **AI Element Suggestions**
   - After approval, invoke orchestrator to suggest elements
   - Pre-populate event with recommended services

6. **Custom Forms**
   - Allow venues to customize inquiry form fields
   - Store custom questions in venue settings

7. **Availability Calendar**
   - Show available dates on booking form
   - Interactive calendar picker
   - Real-time availability checking

## Migration Command

To apply the database migration:

```bash
# Using Supabase CLI
supabase db push

# Or manually run the migration file
psql <connection-string> -f supabase/migrations/20250124000000_client_inquiries.sql
```

## Environment Variables

No new environment variables required. Uses existing Supabase configuration.

## File Summary

### New Files Created

1. `supabase/migrations/20250124000000_client_inquiries.sql` - Database schema
2. `app/api/inquiries/route.ts` - Submit and list inquiries
3. `app/api/inquiries/[inquiryId]/approve/route.ts` - Approve/decline endpoint
4. `app/api/public/venues/[venueSlug]/route.ts` - Public venue info
5. `app/book/[venueSlug]/page.tsx` - Public booking form
6. `components/tasks/InquiryReviewModal.tsx` - Review modal component

### Modified Files

1. `app/venue/tasks/page.tsx` - Now fetches real tasks, handles inquiries

### Existing Files (Used)

1. `app/(auth)/client/confirm/[token]/page.tsx` - Client confirmation
2. `app/api/onboarding/client/route.ts` - Client account creation
3. `app/api/invitations/[token]/route.ts` - Invitation lookup
4. `components/tasks/TaskListView.tsx` - Task list component

## Documentation References

- [docs/onboarding-flows.md](docs/onboarding-flows.md) - Original specification
- [docs/tasks-and-workflows.md](docs/tasks-and-workflows.md) - Task system
- [docs/schema.md](docs/schema.md) - Database schema
- [docs/authentication.md](docs/authentication.md) - Auth flows

---

## Support

For questions or issues with this implementation, refer to the documentation or create an issue in the project repository.
