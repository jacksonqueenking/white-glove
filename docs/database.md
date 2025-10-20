# Database & Storage

## Overview

The platform uses **Supabase** (managed PostgreSQL) as the primary database with **Row-Level Security (RLS)** for data isolation. The database includes 18 tables with complete relationships, constraints, and access controls.

---

## Database Architecture

```
┌─────────────────────────┐
│   Supabase PostgreSQL   │  Primary database
│   - 18 tables           │
│   - RLS policies        │
│   - Real-time enabled   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   CRUD Modules          │  14 modules, 124 functions
│   - Type-safe           │
│   - Zod validated       │
│   - LLM-ready           │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Application Layer     │  Next.js API routes & components
└─────────────────────────┘
```

---

## Database Tables

### Core Entities

**Users & Roles:**
- `clients` - Event organizers (links to auth.users)
- `venues` - Venue businesses (links to auth.users)
- `vendors` - Service providers (links to auth.users)
- `venue_vendors` - Approved vendor-venue relationships

**Events:**
- `events` - Event records with status workflow
- `spaces` - Venue spaces (rooms, halls, outdoor areas)
- `event_spaces` - Many-to-many: events ↔ spaces
- `elements` - Service/product catalog items
- `event_elements` - Elements assigned to specific events
- `tasks` - AI orchestrator work assignments
- `guests` - Event attendees with RSVP tracking

**Communication:**
- `messages` - Human-to-human messaging with threading
- `chats` - AI assistant conversation history (DEPRECATED - see chatkit_threads)
- `notifications` - In-app notification system
- `chatkit_threads` - ChatKit conversation threads
- `chatkit_thread_items` - Messages within ChatKit threads

**Business Operations:**
- `contracts` - Payment agreements with schedules
- `invitations` - User onboarding token system
- `action_history` - Complete audit trail
- `files` - Supabase Storage file references

---

## Quick Start

### Local Development

1. **Start Supabase locally:**
   ```bash
   npx supabase start
   ```

2. **Generate TypeScript types:**
   ```bash
   npx supabase gen types typescript --local > lib/db/database.types.ts
   ```

3. **Update `.env.local`:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<from-supabase-start-output>
   SUPABASE_SERVICE_ROLE_KEY=<from-supabase-start-output>
   ```

4. **Verify setup:**
   ```bash
   npx tsc --noEmit
   ```

---

### Production Deployment

1. **Link to remote project:**
   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REF
   ```

2. **Push migrations:**
   ```bash
   npx supabase db push
   ```

3. **Generate types from production:**
   ```bash
   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/db/database.types.ts
   ```

4. **Set environment variables:**
   ```bash
   # In Vercel or your deployment platform
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<from-supabase-dashboard>
   SUPABASE_SERVICE_ROLE_KEY=<from-supabase-dashboard>
   ```

---

## CRUD Modules

The platform includes 14 CRUD modules with 124 LLM-ready functions.

**Location:** `lib/db/`

### Available Modules

1. **[events.ts](../lib/db/events.ts)** - 10 functions
   - Event lifecycle management
   - Status transitions with validation
   - Space associations

2. **[tasks.ts](../lib/db/tasks.ts)** - 9 functions
   - AI orchestrator's primary tool
   - Auto-creates notifications
   - Status tracking and statistics

3. **[guests.ts](../lib/db/guests.ts)** - 8 functions
   - Bulk import support
   - RSVP management
   - Dietary restrictions tracking

4. **[clients.ts](../lib/db/clients.ts)** - 9 functions
   - Client profile management
   - Preferences and Stripe integration
   - Event statistics

5. **[venues.ts](../lib/db/venues.ts)** - 8 functions
   - Venue profile management
   - Statistics (events, spaces, vendors)
   - Search functionality

6. **[vendors.ts](../lib/db/vendors.ts)** - 9 functions
   - Vendor profile management
   - Contact person tracking
   - Venue relationships

7. **[spaces.ts](../lib/db/spaces.ts)** - 9 functions
   - Space management
   - Photo galleries
   - Availability checking

8. **[elements.ts](../lib/db/elements.ts)** - 8 functions
   - Service/product catalog
   - Category filtering
   - Availability rules

9. **[event_elements.ts](../lib/db/event_elements.ts)** - 8 functions
   - Element assignment to events
   - Status tracking
   - Contract linking
   - Cost calculations

10. **[messages.ts](../lib/db/messages.ts)** - 8 functions
    - Human-to-human messaging
    - Threading support
    - Read receipts
    - Notifications

11. **[chats.ts](../lib/db/chats.ts)** - 9 functions
    - AI conversation management (DEPRECATED)
    - Use chatkit_threads instead for new implementations

12. **[notifications.ts](../lib/db/notifications.ts)** - 9 functions
    - In-app notification system
    - Read/unread tracking
    - Bulk operations
    - Auto-cleanup

13. **[invitations.ts](../lib/db/invitations.ts)** - 10 functions
    - User onboarding system
    - Token generation and validation
    - Accept/Decline support
    - Expiration handling

14. **[contracts.ts](../lib/db/contracts.ts)** - 10 functions
    - Payment contract management
    - Payment schedule generation
    - Signature tracking
    - Stripe integration ready

---

## Row-Level Security (RLS)

All tables have RLS enabled for data isolation.

### Helper Functions

Created in migration `20250101000001_rls_policies.sql`:

```sql
-- Extract user type from JWT metadata
get_user_type() → 'client' | 'venue' | 'vendor'

-- User type checks
is_client() → boolean
is_venue() → boolean
is_vendor() → boolean
```

### Access Patterns

**Clients can access:**
- Their own profile and events
- Events they're assigned to
- Elements for their events
- Tasks assigned to them
- Messages where they're a participant

**Venues can access:**
- Their own profile and spaces
- Events at their venue
- All elements they offer
- Vendor relationships
- Tasks assigned to them
- Messages where they're a participant

**Vendors can access:**
- Their own profile
- Events they're assigned to (via elements)
- Elements they provide
- Venue relationships
- Tasks assigned to them
- Messages where they're a participant

### Example Policy

```sql
-- Clients can only see their own events
CREATE POLICY "Clients view own events"
  ON events FOR SELECT
  USING (auth.uid() = client_id);

-- Venues can see their events
CREATE POLICY "Venues view own events"
  ON events FOR SELECT
  USING (auth.uid() = venue_id);
```

---

## Migrations

### Migration Files

**Location:** `supabase/migrations/`

**Key migrations:**
1. `20250101000000_initial_schema.sql` - All 18 tables
2. `20250101000001_rls_policies.sql` - RLS policies and helper functions
3. `20250120000000_chatkit_schema.sql` - ChatKit thread storage

### Creating New Migrations

```bash
# Create new migration file
npx supabase migration new your_migration_name

# Write your SQL in the generated file
# Then apply locally:
npx supabase migration up

# Or push to remote:
npx supabase db push
```

### Migration Best Practices

1. **Test locally first** - Always test migrations on local Supabase
2. **Use transactions** - Wrap in BEGIN/COMMIT
3. **Add rollback logic** - Include comments on how to revert
4. **Update types** - Regenerate TypeScript types after schema changes
5. **Version control** - Commit migrations with descriptive messages

---

## Data Validation

All CRUD functions use **Zod** for validation.

**Location:** `lib/schemas/index.ts` (500+ lines)

### Example Schema

```typescript
import { z } from 'zod';

export const EventSchema = z.object({
  event_id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  date: z.string().datetime(),
  client_id: z.string().uuid(),
  venue_id: z.string().uuid(),
  status: z.enum([
    'inquiry',
    'pending_confirmation',
    'confirmed',
    'in_planning',
    'finalized',
    'completed',
    'cancelled'
  ]),
  guest_count: z.number().int().positive().optional(),
  budget: z.number().positive().optional(),
});
```

### Validation in CRUD Functions

```typescript
import { EventSchema } from '@/lib/schemas';

export async function createEvent(data: unknown) {
  // Validate input
  const validated = EventSchema.parse(data);

  // Insert into database
  const { data: event, error } = await supabase
    .from('events')
    .insert(validated)
    .select()
    .single();

  if (error) throw error;
  return event;
}
```

---

## Using CRUD Functions

### Basic Example

```typescript
import { createEvent, getEvent, updateEvent } from '@/lib/db/events';

// Create new event
const event = await createEvent({
  name: 'Annual Charity Gala',
  date: '2025-12-15T18:00:00Z',
  venue_id: venueId,
  client_id: clientId,
  status: 'inquiry',
  guest_count: 150,
  budget: 50000,
});

// Retrieve event
const retrieved = await getEvent(event.event_id);

// Update event
await updateEvent(event.event_id, {
  status: 'confirmed',
  guest_count: 175,
});
```

### With AI Agents

CRUD functions are designed to be callable by AI agents:

```typescript
// In agent tool handler
export const clientToolHandlers = {
  async getEventDetails(params: { eventId: string }) {
    const event = await getEvent(params.eventId);
    const spaces = await getEventSpaces(params.eventId);
    const elements = await listEventElements(params.eventId);

    return {
      event,
      spaces,
      elements,
    };
  },
};
```

---

## Supabase Client Setup

**Location:** `lib/db/supabaseClient.ts`

### Two Client Types

1. **RLS-enabled client** (for user operations):
   ```typescript
   import { createClient } from '@/lib/supabase/server';

   const supabase = await createClient();
   // Respects RLS policies
   ```

2. **Admin client** (for system operations):
   ```typescript
   import { supabaseAdmin } from '@/lib/db/supabaseClient';

   // Bypasses RLS - use with caution
   const { data } = await supabaseAdmin
     .from('events')
     .select('*');
   ```

### When to Use Admin Client

- System-level operations
- Background jobs
- Cross-user analytics
- Admin dashboard queries
- Data migrations

**Warning:** Admin client bypasses all security. Only use when necessary and validate permissions in application code.

---

## Real-Time Subscriptions

Supabase provides real-time updates for all tables.

### Example: Listen for New Messages

```typescript
const supabase = createClient();

const channel = supabase
  .channel('messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `recipient_id=eq.${userId}`,
    },
    (payload) => {
      console.log('New message:', payload.new);
      // Update UI
    }
  )
  .subscribe();

// Cleanup
return () => {
  channel.unsubscribe();
};
```

### Common Use Cases

- Live chat messages
- Task updates
- Notification badges
- Event status changes
- Real-time collaboration

---

## Performance Optimization

### Indexes

Key indexes are created in migrations:

```sql
-- Events
CREATE INDEX idx_events_client_id ON events(client_id);
CREATE INDEX idx_events_venue_id ON events(venue_id);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_status ON events(status);

-- Tasks
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to_id, assigned_to_type);
CREATE INDEX idx_tasks_event_id ON tasks(event_id);
CREATE INDEX idx_tasks_status ON tasks(status);

-- Messages
CREATE INDEX idx_messages_thread_id ON messages(thread_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id, recipient_type);
```

### Query Optimization Tips

1. **Use indexes** - Query indexed columns
2. **Limit results** - Use `.limit()` for pagination
3. **Select specific columns** - Avoid `SELECT *`
4. **Use joins** - Instead of multiple queries
5. **Cache frequent queries** - Use Redis for hot data

---

## Backup & Recovery

### Automated Backups

Supabase provides automatic daily backups (retention depends on plan).

### Manual Backup

```bash
# Export entire database
npx supabase db dump > backup.sql

# Export specific table
npx supabase db dump -t events > events_backup.sql
```

### Restore from Backup

```bash
# Restore full database
psql -h db.your-project.supabase.co -U postgres -d postgres < backup.sql

# Or use Supabase CLI
npx supabase db reset
```

---

## Troubleshooting

### "Cannot connect to database"

**Symptoms:** Connection timeouts or refused connections

**Checks:**
1. Verify Supabase project is active
2. Check environment variables are set correctly
3. Confirm API keys are valid
4. Check network/firewall settings

**Fix:**
```bash
# Test connection
npx supabase db remote commit

# Check project status in dashboard
# Restart project if needed
```

---

### "RLS policy blocks query"

**Symptoms:** Queries return empty results or permission denied

**Checks:**
1. Verify user is authenticated
2. Check user_metadata contains user_type
3. Confirm user has access to the resource
4. Review RLS policies in Supabase dashboard

**Fix:**
```typescript
// Check user metadata
const { data: { user } } = await supabase.auth.getUser();
console.log(user?.user_metadata);

// Use admin client for system operations
import { supabaseAdmin } from '@/lib/db/supabaseClient';
```

---

### "Type errors after schema changes"

**Symptoms:** TypeScript errors after modifying database

**Fix:**
```bash
# Regenerate types
npx supabase gen types typescript --local > lib/db/database.types.ts

# Or from remote
npx supabase gen types typescript --project-id YOUR_ID > lib/db/database.types.ts

# Verify compilation
npx tsc --noEmit
```

---

### Slow queries

**Symptoms:** Database operations taking too long

**Diagnosis:**
```sql
-- In Supabase SQL Editor, check slow queries
SELECT * FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

**Optimizations:**
1. Add missing indexes
2. Optimize query structure
3. Use query explain: `EXPLAIN ANALYZE SELECT ...`
4. Consider materialized views for complex queries
5. Implement caching for frequent reads

---

## Monitoring

### Key Metrics

Monitor in Supabase Dashboard:
- Database size
- Connection count
- Query performance
- API requests
- Error rates

### Alerts

Configure alerts for:
- Database storage > 80% capacity
- Connection pool exhaustion
- High error rates
- Slow query thresholds

---

## Resources

### Official Documentation
- **Supabase Docs:** https://supabase.com/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Supabase CLI:** https://supabase.com/docs/guides/cli

### Internal Documentation
- [Schema Documentation](./schema.md) - Detailed entity definitions
- [Architecture](./architecture.md) - System design overview
- [Authentication](./authentication.md) - Auth setup and RLS

---

## Future Enhancements

**Potential improvements:**

**Performance:**
- Read replicas for scaling
- Connection pooling optimization
- Query result caching (Redis)
- Materialized views for analytics

**Features:**
- Full-text search (PostgreSQL tsvector)
- Geospatial queries (PostGIS)
- Time-series data (for analytics)
- Graph relationships (for recommendations)

**Operations:**
- Automated testing of migrations
- Database seeding for development
- Performance monitoring dashboard
- Automated schema documentation generation
