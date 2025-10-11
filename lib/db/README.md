# Database Module

This directory contains all database-related functionality for the White Glove Event Management Platform.

## 🟢 Status: LIVE and Deployed

**Supabase Project:** `wtvppudhrdhewosqgdzz` - [View Dashboard](https://supabase.com/dashboard/project/wtvppudhrdhewosqgdzz)

✅ 18 tables deployed
✅ Row-Level Security active
✅ 124 CRUD functions ready
✅ TypeScript types generated

See [DATABASE_DEPLOYED.md](../../DATABASE_DEPLOYED.md) for full deployment details.

## Overview

The database uses **Supabase** (PostgreSQL) with:
- Row-Level Security (RLS) for data access control
- Zod schemas for validation
- TypeScript types generated from the database schema
- CRUD functions designed as LLM-callable tools

## Directory Structure

```
lib/db/
├── README.md                  # This file
├── supabaseClient.ts          # Supabase client configuration
├── database.types.ts          # Auto-generated TypeScript types
├── events.ts                  # Event CRUD
├── tasks.ts                   # Task CRUD
├── guests.ts                  # Guest CRUD
├── clients.ts                 # Client CRUD
├── venues.ts                  # Venue CRUD
├── vendors.ts                 # Vendor CRUD
├── spaces.ts                  # Space CRUD
├── elements.ts                # Element CRUD
├── event_elements.ts          # Event element CRUD
├── messages.ts                # Message CRUD
├── chats.ts                   # Chat CRUD
├── notifications.ts           # Notification CRUD
├── invitations.ts             # Invitation CRUD
└── contracts.ts               # Contract CRUD
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js zod
```

### 2. Set Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Run Database Migrations

Apply the migrations to create all tables:

```bash
# Using Supabase CLI (recommended)
npx supabase db push

# Or manually in Supabase Dashboard SQL Editor
# Run the migration files in order:
# 1. supabase/migrations/20250101000000_initial_schema.sql
# 2. supabase/migrations/20250101000001_rls_policies.sql
```

### 4. Generate TypeScript Types

After migrations are applied:

```bash
# From local database
npx supabase gen types typescript --local > lib/db/database.types.ts

# Or from remote project
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/db/database.types.ts
```

## Usage

### Importing

```typescript
import { supabase, supabaseAdmin } from '@/lib/db/supabaseClient';
import { getEvent, createEvent } from '@/lib/db/events';
import { createTask, completeTask } from '@/lib/db/tasks';
import { sendMessage, listMessagesInThread } from '@/lib/db/messages';
```

### Client vs Admin

#### Client (`supabase`)
- Uses anon key
- Respects Row-Level Security (RLS)
- Use in browser and API routes where you want RLS enforcement

```typescript
import { supabase } from '@/lib/db/supabaseClient';

// This will only return events the authenticated user can access
const { data } = await supabase.from('events').select('*');
```

#### Admin (`supabaseAdmin`)
- Uses service role key
- **Bypasses RLS**
- ⚠️ Only use server-side for admin operations
- Always validate permissions in application logic

```typescript
import { supabaseAdmin } from '@/lib/db/supabaseClient';

// This can access ALL data - use with caution
const { data } = await supabaseAdmin.from('notifications').insert(...);
```

## Available Modules

### Core Entities

#### Events ([events.ts](events.ts))
Event management operations.
- `createEvent`, `updateEvent`, `deleteEvent`
- `changeEventStatus` - With audit logging
- `listEvents`, `getEventsByDateRange`
- `addSpacesToEvent`, `removeSpaceFromEvent`, `getEventSpaces`

#### Tasks ([tasks.ts](tasks.ts))
Task management for AI orchestrator.
- `createTask` - Auto-sends notification
- `completeTask`, `cancelTask` - With audit logging
- `listTasks`, `getOverdueTasks`, `getTasksDueSoon`
- `getTaskStats` - Get counts by status

#### Guests ([guests.ts](guests.ts))
Guest and RSVP management.
- `bulkCreateGuests` - Import multiple guests
- `listGuests`, `searchGuests`
- `getGuestStats` - RSVP counts and expected attendance
- `getGuestsWithDietaryRestrictions`

### Users

#### Clients ([clients.ts](clients.ts))
Client user management.
- `createClient`, `updateClient`, `deleteClient`
- `getClientByEmail`, `listClients`
- `updateClientPreferences`, `updateClientStripeId`
- `getClientEventCount`

#### Venues ([venues.ts](venues.ts))
Venue user management.
- `createVenue`, `updateVenue`, `deleteVenue`
- `listVenues`, `searchVenues`
- `getVenueEventCount`, `getVenueSpaceCount`
- `getVenueStats` - Events, spaces, vendors count

#### Vendors ([vendors.ts](vendors.ts))
Vendor user management.
- `createVendor`, `updateVendor`, `deleteVendor`
- `getVendorByEmail`, `searchVendors`
- `getVendorVenues`, `getVendorEvents`
- `addVendorContactPerson`

### Services & Spaces

#### Spaces ([spaces.ts](spaces.ts))
Venue space management.
- `createSpace`, `updateSpace`, `deleteSpace`
- `listSpaces`, `addSpacePhotos`, `removeSpacePhoto`
- `checkSpaceAvailability`, `getSpaceUpcomingEvents`

#### Elements ([elements.ts](elements.ts))
Service/product offerings.
- `createElement`, `updateElement`, `deleteElement`
- `listElements`, `getVenueElements`, `getElementsByCategory`
- `isElementAvailable`, `searchElements`

#### Event Elements ([event_elements.ts](event_elements.ts))
Elements assigned to events.
- `addElementToEvent`, `removeElementFromEvent`
- `updateEventElement`, `changeEventElementStatus`
- `getEventElementsByStatus`, `getEventElementTotals`
- `updateEventElementContract`

### Communication

#### Messages ([messages.ts](messages.ts))
Human-to-human messaging.
- `sendMessage` - Auto-creates notification
- `listMessagesInThread`, `getUserMessageThreads`
- `markMessageAsRead`, `markThreadAsRead`
- `getUnreadMessageCount`, `searchMessages`

#### Chats ([chats.ts](chats.ts))
AI assistant conversations.
- `createChat`, `getOrCreateEventChat`
- `addMessageToChat`, `listUserChats`, `getEventChats`
- `archiveChat`, `unarchiveChat`, `deleteChat`

#### Notifications ([notifications.ts](notifications.ts))
In-app notifications.
- `createNotification`, `bulkCreateNotifications`
- `listNotifications`, `markNotificationAsRead`
- `markAllNotificationsAsRead`, `getUnreadNotificationCount`
- `deleteOldNotifications`

### Onboarding & Payments

#### Invitations ([invitations.ts](invitations.ts))
User invitation system.
- `createInvitation`, `getInvitationByToken`
- `acceptInvitation`, `declineInvitation`
- `verifyInvitationToken`, `resendInvitation`
- `listInvitations`, `expireOldInvitations`

#### Contracts ([contracts.ts](contracts.ts))
Payment contracts.
- `createContract`, `updateContract`, `signContract`
- `getEventContract`, `getContractPaymentStatus`
- `recordContractPayment`, `generatePaymentSchedule`
- `getContractsRequiringAttention`

## LLM Tool Integration

All CRUD functions are designed to be called by LLM agents as tools with:

1. **Clear Docstrings** - Detailed JSDoc comments explaining purpose and usage
2. **Well-labeled Parameters** - Descriptive parameter names with types
3. **Type Safety** - Full TypeScript + Zod validation
4. **Error Handling** - Meaningful error messages
5. **Return Values** - Predictable, typed return values
6. **Side Effects** - Automatic logging and notifications where appropriate

Example:
```typescript
/**
 * Create a new task for a user
 *
 * This is the primary function the AI orchestrator uses to assign work to users.
 * It automatically creates a notification for the assigned user.
 *
 * @param task - The task data to create
 * @returns The created task object
 * @throws {Error} If validation fails or database insert fails
 *
 * @example
 * const task = await createTask({
 *   event_id: 'event-uuid',
 *   assigned_to_id: 'user-uuid',
 *   assigned_to_type: 'client',
 *   name: 'Confirm guest count',
 *   description: 'Please provide the final guest count for your event',
 *   priority: 'high',
 *   created_by: 'orchestrator'
 * });
 */
```

## Row-Level Security (RLS)

All tables have RLS policies that enforce data access control:

- **Clients**: Can only view/update their own events, guests, and tasks
- **Venues**: Can view/update their own events and manage all event details
- **Vendors**: Can view events they're assigned to via event_elements
- **Messages**: Users can only see messages where they are sender or recipient
- **Admin**: Use `supabaseAdmin` to bypass RLS for system operations

## Schema & Validation

All Zod schemas are in [lib/schemas/index.ts](../schemas/index.ts):

```typescript
import { CreateEventSchema, EventSchema } from '@/lib/schemas';

// Validate input
const validated = CreateEventSchema.parse(userInput);

// Use in CRUD operation
const event = await createEvent(validated);
```

## Function Count by Module

- **events.ts**: 10 functions
- **tasks.ts**: 9 functions
- **guests.ts**: 8 functions
- **clients.ts**: 9 functions
- **venues.ts**: 8 functions
- **vendors.ts**: 9 functions
- **spaces.ts**: 9 functions
- **elements.ts**: 8 functions
- **event_elements.ts**: 8 functions
- **messages.ts**: 8 functions
- **chats.ts**: 9 functions
- **notifications.ts**: 9 functions
- **invitations.ts**: 10 functions
- **contracts.ts**: 10 functions

**Total: 124 LLM-ready CRUD functions**

## Complete Setup Example

```typescript
// 1. Install dependencies
// npm install @supabase/supabase-js zod

// 2. Apply migrations
// npx supabase db push

// 3. Generate types
// npx supabase gen types typescript --local > lib/db/database.types.ts

// 4. Use in your application
import { createEvent, addElementToEvent } from '@/lib/db/events';
import { createTask } from '@/lib/db/tasks';
import { bulkCreateGuests } from '@/lib/db/guests';

// Create an event
const event = await createEvent({
  name: 'Smith Wedding',
  date: '2025-10-15T14:00:00Z',
  venue_id: 'venue-uuid',
  status: 'inquiry'
});

// Add guests
await bulkCreateGuests([
  { event_id: event.event_id, name: 'John Doe', email: 'john@example.com' },
  { event_id: event.event_id, name: 'Jane Smith', email: 'jane@example.com' }
]);

// Create a task for the client
await createTask({
  event_id: event.event_id,
  assigned_to_id: 'client-uuid',
  assigned_to_type: 'client',
  name: 'Review venue options',
  description: 'Please review the available spaces and let us know your preference',
  priority: 'high',
  created_by: 'orchestrator'
});
```

## Additional Resources

- [Project Schema Documentation](/docs/schema.md)
- [Project Architecture Documentation](/docs/architecture.md)
- [Supabase Documentation](https://supabase.com/docs)
- [Zod Documentation](https://zod.dev)
