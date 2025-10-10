# Database Schema

## Overview

This document defines all database entities, their relationships, and validation rules.

## Entity Definitions

### Client

Represents an individual or organization booking events.

```typescript
interface Client {
  client_id: string; // UUID, primary key
  name: string;
  email: string; // unique
  phone: string;
  credit_card: string; // tokenized via Stripe
  billing_address: Address; // JSON
  events: Event[]; // one-to-many relationship
  preferences: ClientPreferences; // JSON
  created_at: timestamp;
  updated_at: timestamp;
}

interface ClientPreferences {
  people: Person[]; // Important contacts (VIPs, planners, assistants)
  food: string; // Dietary preferences and restrictions
  notes: string; // General preferences
}

interface Person {
  name: string;
  role: string; // "VIP", "Event Planner", "Assistant", etc.
  email?: string;
  phone?: string;
  notes?: string;
}

interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}
```

**Validation Rules (Zod):**
- Email must be valid format
- Phone must be valid format
- All required fields must be present

---

### Venue

Represents an event venue location.

```typescript
interface Venue {
  venue_id: string; // UUID, primary key
  name: string;
  description: string;
  address: Address; // JSON
  venue_vendors: VenueVendor[]; // one-to-many relationship
  events: Event[]; // one-to-many relationship
  calendar: Calendar; // JSON or separate table
  spaces: Space[]; // one-to-many relationship
  created_at: timestamp;
  updated_at: timestamp;
}
```

**Validation Rules:**
- Name required, min 3 characters
- Address must be complete
- At least one space required before going live

---

### VenueVendor

Relationship table between venues and vendors, storing venue-specific information.

**Note:** For elements the venue provides in-house, create a VenueVendor record where `vendor_id` = `venue_id` (venue acts as its own vendor). Approval status and COIs can be marked as N/A or auto-approved for venue-as-vendor records.

```typescript
interface VenueVendor {
  venue_vendor_id: string; // UUID, primary key
  venue_id: string; // foreign key to venues
  vendor_id: string; // foreign key to vendors
  approval_status: ApprovalStatus; // "pending" | "approved" | "rejected" | "n/a"
  cois: COI[]; // Certificate of Insurance records
  elements: Element[]; // Vendor's offerings at this venue
  created_at: timestamp;
  updated_at: timestamp;
}

type ApprovalStatus = "pending" | "approved" | "rejected" | "n/a";

interface COI {
  document_url: string;
  completed: boolean;
  expiration_date: date;
  insurance_type: string;
  coverage_amount: number;
}
```

**Validation Rules:**
- Venue and vendor must exist
- Unique constraint on (venue_id, vendor_id)
- COIs required for external vendors, optional for venue-as-vendor

---

### Vendor

Represents a service provider (florist, caterer, DJ, etc.).

```typescript
interface Vendor {
  vendor_id: string; // UUID, primary key
  name: string;
  email: string; // unique
  phone_number: string;
  address: Address; // JSON
  description: string;
  created_at: timestamp;
  updated_at: timestamp;
}
```

**Validation Rules:**
- Email must be unique and valid
- Phone must be valid format

---

### Space

Represents a bookable space within a venue.

```typescript
interface Space {
  space_id: string; // UUID, primary key
  venue_id: string; // foreign key to venues
  name: string;
  description: string;
  main_image_url: string;
  photos: Photo[]; // JSON array or separate table
  floorplan_url?: string;
  capacity?: number;
  created_at: timestamp;
  updated_at: timestamp;
}

interface Photo {
  url: string;
  caption?: string;
  order: number;
}
```

**Validation Rules:**
- Name required
- Main image required before going live

---

### Event

Represents a scheduled event.

```typescript
interface Event {
  event_id: string; // UUID, primary key
  name: string;
  description?: string;
  date: datetime;
  client_id: string; // foreign key to clients
  venue_id: string; // foreign key to venues
  spaces: Space[]; // many-to-many relationship
  calendar: Schedule; // Detailed event schedule (structure TBD)
  guests: Guest[]; // one-to-many relationship
  contract_bill: ContractBill; // Structure TBD
  elements: EventElement[]; // one-to-many relationship
  tasks: Task[]; // one-to-many relationship
  action_history: ActionHistory[]; // one-to-many relationship
  status: EventStatus; // "inquiry" | "pending_confirmation" | "confirmed" | "in_planning" | "finalized" | "completed" | "cancelled"
  created_at: timestamp;
  updated_at: timestamp;
}

type EventStatus = 
  | "inquiry" // Initial inquiry submitted
  | "pending_confirmation" // Venue approved, awaiting client confirmation
  | "confirmed" // Client confirmed booking
  | "in_planning" // Active planning phase
  | "finalized" // All elements confirmed, ready for event
  | "completed" // Event has occurred
  | "cancelled"; // Event cancelled
```

**Validation Rules:**
- Date must be in the future (for new events)
- At least one space required
- Client and venue must exist

---

### EventElement

Links an element to an event with event-specific details.

```typescript
interface EventElement {
  event_element_id: string; // UUID, primary key
  event_id: string; // foreign key to events
  element_id: string; // foreign key to elements
  status: ElementStatus; // "to-do" | "in_progress" | "completed" | "needs_attention"
  customization?: string; // Custom specifications for this event
  amount: number; // Final agreed price (may differ from element base price)
  contract_completed: boolean;
  notes?: string;
  created_at: timestamp;
  updated_at: timestamp;
}

type ElementStatus = "to-do" | "in_progress" | "completed" | "needs_attention";
```

---

### Element

Represents a service or item that can be provided (flowers, catering, DJ, etc.).

```typescript
interface Element {
  element_id: string; // UUID, primary key
  venue_vendor_id: string; // foreign key to venue_vendors
  name: string;
  image_url?: string;
  price: number; // Base price
  description: string;
  files: File[]; // JSON array or separate table (menus, samples, etc.)
  contract?: Contract; // Structure TBD
  availability_rules: AvailabilityRules; // JSON
  created_at: timestamp;
  updated_at: timestamp;
}

interface AvailabilityRules {
  lead_time_days: number; // Minimum days notice required
  blackout_dates?: date[];
  seasonal_pricing?: SeasonalPricing[];
}

interface SeasonalPricing {
  start_date: date;
  end_date: date;
  price_multiplier: number;
}
```

**Method:** `is_available(date: datetime, lead_time: number): boolean`
- Checks if element can be booked for given date
- Considers lead time and blackout dates

---

### Task

Represents an action item for a user.

```typescript
interface Task {
  task_id: string; // UUID, primary key
  event_id: string; // foreign key to events
  assigned_to_id: string; // foreign key to users (client, venue, or vendor)
  assigned_to_type: UserType; // "client" | "venue" | "vendor"
  status: TaskStatus; // "pending" | "in_progress" | "completed" | "cancelled"
  name: string;
  description: string;
  form_data?: any; // JSON - Dynamic form schema if task requires form completion
  form_response?: any; // JSON - Response data when task completed
  priority: Priority; // "low" | "medium" | "high" | "urgent"
  due_date?: datetime;
  created_by: string; // AI orchestrator or user ID
  created_at: timestamp;
  updated_at: timestamp;
  completed_at?: timestamp;
}

type UserType = "client" | "venue" | "vendor";
type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
type Priority = "low" | "medium" | "high" | "urgent";
```

---

### Guest

Represents an attendee of an event.

```typescript
interface Guest {
  guest_id: string; // UUID, primary key
  event_id: string; // foreign key to events
  name: string;
  title?: string; // "Dr.", "CEO", etc.
  phone?: string;
  email?: string;
  notes?: string;
  rsvp_status: RSVPStatus; // "yes" | "no" | "undecided"
  dietary_restrictions?: string;
  plus_one: boolean;
  created_at: timestamp;
  updated_at: timestamp;
}

type RSVPStatus = "yes" | "no" | "undecided";
```

---

### Message

Represents human-to-human communication.

```typescript
interface Message {
  message_id: string; // UUID, primary key
  thread_id: string; // Group related messages
  event_id?: string; // foreign key to events (optional)
  sender_id: string; // foreign key to users
  sender_type: UserType; // "client" | "venue" | "vendor"
  recipient_id: string; // foreign key to users
  recipient_type: UserType;
  content: string;
  attachments?: Attachment[]; // JSON array
  action_required: boolean;
  suggested_response?: string; // AI-generated suggested reply
  read: boolean;
  created_at: timestamp;
}

interface Attachment {
  url: string;
  filename: string;
  mimetype: string;
  size: number;
}
```

---

### Chat

Represents AI assistant conversation history.

```typescript
interface Chat {
  chat_id: string; // UUID, primary key
  user_id: string; // foreign key to users (client or venue)
  user_type: UserType; // "client" | "venue"
  event_id?: string; // foreign key to events (optional)
  messages: ChatMessage[]; // JSON array or separate table
  archived: boolean;
  created_at: timestamp;
  updated_at: timestamp;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: datetime;
  tool_calls?: ToolCall[];
}

interface ToolCall {
  tool_name: string;
  parameters: any;
  result: any;
  timestamp: datetime;
}
```

---

## Relationships

### One-to-Many
- `Client` → `Event`
- `Venue` → `Event`
- `Venue` → `Space`
- `Venue` → `VenueVendor`
- `Vendor` → `VenueVendor`
- `VenueVendor` → `Element`
- `Event` → `Guest`
- `Event` → `EventElement`
- `Event` → `Task`
- `Event` → `ActionHistory`
- `User` → `Chat`
- `Chat` → `ChatMessage`

### Many-to-Many
- `Event` ↔ `Space` (an event can use multiple spaces)
- `Event` ↔ `Element` (through `EventElement` junction table)

## Indexes

**Critical Indexes for Performance:**

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
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Messages
CREATE INDEX idx_messages_thread_id ON messages(thread_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id, recipient_type);
CREATE INDEX idx_messages_event_id ON messages(event_id);

-- VenueVendor
CREATE UNIQUE INDEX idx_venue_vendor_unique ON venue_vendors(venue_id, vendor_id);

-- Guests
CREATE INDEX idx_guests_event_id ON guests(event_id);
CREATE INDEX idx_guests_rsvp_status ON guests(rsvp_status);
```

## Row-Level Security (RLS) Policies

**Supabase RLS Examples:**

```sql
-- Clients can only see their own data
CREATE POLICY "Clients view own events"
  ON events FOR SELECT
  USING (auth.uid() = client_id);

-- Venues can see their events
CREATE POLICY "Venues view own events"
  ON events FOR SELECT
  USING (auth.uid() = venue_id);

-- Vendors can see events they're involved in
CREATE POLICY "Vendors view assigned events"
  ON events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_elements ee
      JOIN elements e ON ee.element_id = e.element_id
      JOIN venue_vendors vv ON e.venue_vendor_id = vv.venue_vendor_id
      WHERE ee.event_id = events.event_id
        AND vv.vendor_id = auth.uid()
    )
  );
```

## Migration Strategy

### Version Control
- Use Supabase migrations
- Semantic versioning for schema changes
- Rollback procedures documented

### Testing Migrations
1. Test on local database
2. Deploy to staging
3. Validate data integrity
4. Deploy to production during low-traffic window
5. Monitor for issues

## Data Retention

- **Active events:** Retained indefinitely
- **Completed events:** Retained for 7 years (tax/legal requirements)
- **Cancelled events:** Retained for 1 year
- **Chat history:** Retained for 2 years
- **Action history:** Retained indefinitely (audit trail)
- **Messages:** Retained for 2 years
- **Tasks:** Retained indefinitely (completed tasks archived)