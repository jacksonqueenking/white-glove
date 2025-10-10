# Architecture Overview

## System Architecture

This platform uses a three-tier architecture with AI orchestration as a cross-cutting concern:

### Frontend Layer (Next.js + TypeScript)
- Server-side rendering for performance
- Client-side hydration for interactivity
- Real-time updates via Supabase subscriptions
- Responsive design with Tailwind CSS

### Backend Layer
**Supabase:**
- Primary database (PostgreSQL)
- Authentication and authorization
- Real-time subscriptions
- Row-level security (RLS)
- File storage

**Redis:**
- Session caching
- Rate limiting
- Temporary data storage
- Queue management for background jobs

### AI Orchestration Layer (LangGraph)
- Provider-agnostic LLM integration
- State graph management for workflows
- Tool execution and coordination
- Context management across conversations

## AI Orchestration Architecture

The orchestrator is the "brain" of the platform, managing all coordination between parties.

### How It Works

```
Client Chat → Orchestrator → Task Creation
                ↓
Venue AI ← Orchestrator → Vendor Communication
                ↓
         Database Updates
                ↓
         Real-time UI Updates
```

### LangGraph State Management

Each event has an associated state graph that tracks:
- Current workflow state
- Pending tasks
- Conversation history
- Action history
- Approval chains

**State Transitions:**
```
Event Created → Elements Suggested → Awaiting Client Approval
     ↓                                        ↓
Venue Approved ← Task Created ← Client Requests Change
     ↓
Vendor Notified → Vendor Confirms → Element Finalized
```

### Orchestrator Responsibilities

1. **Context Awareness**
   - Maintains full context for each event
   - Tracks relationships between entities
   - Remembers conversation history
   - Understands current state

2. **Dynamic Task Creation**
   - Analyzes conversations and actions
   - Creates appropriate tasks for right parties
   - Generates custom forms when needed
   - Sets priorities and deadlines

3. **Information Routing**
   - Determines who needs to know what
   - Routes messages to appropriate parties
   - Synthesizes information from multiple sources
   - Maintains thread continuity

4. **Workflow Management**
   - Enforces business rules
   - Manages approval chains
   - Handles escalations
   - Tracks progress

5. **Notification Management**
   - Decides notification urgency
   - Respects user preferences
   - Sends via appropriate channel (in-app vs email)
   - Manages reminder schedules

### Tool Architecture

All platform functions that can be invoked by AI agents are structured as tools:

**Tool Requirements:**
- Docstrings explaining purpose
- Well-labeled parameters with types
- Zod validation schemas
- Error handling
- Audit logging

**Tool Categories:**
- CRUD operations (create, read, update, delete)
- Messaging and communication
- File and image operations
- Payment processing
- Notification sending
- Form generation

### Dynamic Form Generation

The orchestrator can create custom forms for complex tasks:

**Example: Custom Floral Arrangement Request**
```typescript
{
  type: "form",
  fields: [
    { name: "flowers", type: "multiselect", options: [...] },
    { name: "colors", type: "color-picker" },
    { name: "style", type: "select", options: [...] },
    { name: "budget", type: "number", min: 0 },
    { name: "notes", type: "textarea" }
  ],
  submitTo: "orchestrator",
  taskId: "..."
}
```

Form submissions return to orchestrator, which:
1. Validates the data
2. Determines next actions
3. Creates follow-up tasks if needed
4. Notifies relevant parties

## Real-Time Updates

### Supabase Real-Time Subscriptions

```typescript
// Subscribe to event updates
supabase
  .channel('event-updates')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'events' },
    (payload) => handleEventUpdate(payload)
  )
  .subscribe()
```

**What Updates in Real-Time:**
- Task creation and status changes
- Element status updates
- Message arrival
- Payment confirmations
- RSVP updates
- File uploads
- Status indicators

### WebSocket Connections

For chat interfaces, maintain WebSocket connections for:
- Instant message delivery
- Typing indicators
- Presence information
- Live status updates

## Database Architecture

### Supabase (PostgreSQL)

**Schema Design Principles:**
- Normalized data structure
- Foreign key constraints
- Row-level security (RLS) policies
- Indexes on frequently queried fields
- JSON columns for flexible data (preferences, metadata)

**Key Tables:**
- `clients`
- `venues`
- `vendors`
- `venue_vendors` (relationship table)
- `events`
- `spaces`
- `elements`
- `tasks`
- `guests`
- `messages`
- `action_history`
- `files`

See [database-schema.md](../data/database-schema.md) for the full schema definition.

### Redis

**Use Cases:**
- User session caching
- Rate limiting per user/IP
- Background job queues
- Temporary form data
- Real-time presence tracking
- Cache frequently accessed data

**Key Patterns:**
```
user:{id}:session → session data (TTL: 7 days)
rate_limit:{ip}:{endpoint} → request count (TTL: 1 minute)
task_queue:{event_id} → pending tasks
form_draft:{form_id} → temporary form data (TTL: 24 hours)
```

## Security Architecture

### Authentication
- Supabase Auth with JWT tokens
- Magic link authentication (primary)
- Password authentication (fallback)
- Optional 2FA for venues
- Session management with refresh tokens

### Authorization
- Row-level security (RLS) in Supabase
- User roles: client, venue, vendor, admin
- Event-level permissions
- Venue-vendor relationships control access

### Data Protection
- Encrypted at rest (Supabase)
- Encrypted in transit (TLS)
- Sensitive data tokenization (Stripe)
- Audit logging for all actions
- GDPR compliance measures

## Payment Processing

### Stripe Integration

**Payment Flows:**
1. Client selects elements
2. System calculates total with deposit rules
3. Stripe checkout session created
4. Payment processed
5. Webhook confirms payment
6. Database updated
7. Parties notified

**Webhook Handling:**
```typescript
// Handle Stripe webhooks
POST /api/webhooks/stripe
  → Verify signature
  → Process event
  → Update database
  → Trigger notifications
```

## Scalability Considerations

### Current Architecture
- Optimized for 1-100 venues
- Handles ~1000 concurrent users
- Supports ~100 events per venue per year

### Future Scaling
- Horizontal scaling of Next.js instances
- Read replicas for Supabase
- Redis cluster for cache
- CDN for static assets
- Background job workers
- Event-driven architecture for heavy processing

## Deployment

### Recommended Stack
- **Frontend:** Vercel (Next.js optimized)
- **Database:** Supabase (managed PostgreSQL)
- **Cache:** Redis (self-hosted or managed Redis service)
- **Payments:** Stripe
- **Monitoring:** Sentry for errors, PostHog for analytics

### CI/CD Pipeline
1. Push to GitHub
2. Run tests
3. Type checking
4. Linting
5. Deploy to staging
6. Manual approval
7. Deploy to production

## Monitoring & Observability

### Key Metrics
- API response times
- Database query performance
- LLM tool call latency
- Payment success rates
- Task completion rates
- User engagement metrics

### Logging
- Structured logging (JSON format)
- Log levels: DEBUG, INFO, WARN, ERROR
- Request IDs for tracing
- User actions audit log
- LLM interactions log

### Alerts
- High error rates
- Database connection issues
- Payment processing failures
- Unusual activity patterns
- Performance degradation
