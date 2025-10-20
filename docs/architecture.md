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

### AI Orchestration Layer (OpenAI Agents SDK)
- OpenAI GPT-4o for AI agents
- Three specialized agent types (client, venue_general, venue_event)
- Tool execution and coordination
- Context management via system prompts

## AI Agent Architecture

The platform uses specialized AI agents built with **OpenAI Agents SDK** to coordinate events.

### Agent Flow

```
User → ChatKit UI → Custom Backend → Agent Selection
                                            ↓
                                    OpenAI Agents SDK
                                            ↓
                                    Tool Execution
                                            ↓
                            Database Updates / Messages
                                            ↓
                                Real-time UI Updates
```

### Three Specialized Agents

**1. Client Agent**
- Helps clients plan their events
- Context: Client info, event details, available elements
- Tools: View event, request changes, manage guests, view contracts

**2. Venue General Agent**
- Helps venue staff manage all operations
- Context: All venue events, vendors, tasks
- Tools: List events, manage vendors, coordinate communications

**3. Venue Event Agent**
- Helps venue staff coordinate specific events
- Context: Detailed event information, client data, vendors
- Tools: Manage elements, send messages, create tasks, update status

**Implementation:** See [ChatKit documentation](./chatkit.md) for details.

### Agent Architecture

Each agent is composed of:
1. **System Prompt** - Defines role, personality, and behavior
2. **Context Builder** - Gathers relevant data for conversation
3. **Tools** - Available actions (database operations, messaging, etc.)
4. **Tool Handlers** - Business logic implementations

**Code Structure:**
- `lib/agents/prompts.ts` - System prompts
- `lib/agents/context.ts` - Context builders
- `lib/agents/tools.ts` - Tool definitions
- `lib/agents/toolHandlers.ts` - Tool implementations
- `lib/agents/agentSDK.ts` - Agent factory functions

### Agent Responsibilities

Agents can:

1. **Answer Questions** - Using provided context
2. **Execute Actions** - Via tool calling (database operations)
3. **Create Tasks** - For other users when coordination needed
4. **Send Messages** - Between clients, venues, and vendors
5. **Manage Data** - Update events, elements, guests, etc.
6. **Make Decisions** - Within defined boundaries and escalate when needed

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
