# Messaging System Documentation

## Overview

The platform has two distinct communication systems that serve different purposes. Understanding this distinction is critical to implementing and using the system correctly.

---

## Two Communication Systems

### 1. Chats (AI Conversations)

**What they are:**
- Conversations between users and AI assistants
- Powered by LLMs (Large Language Models)
- Context-aware and can take actions via tools
- Have memory and persistent history

**Who has them:**
- ✅ **Clients:** Chat with AI assistant to plan their event
- ✅ **Venues:** Chat with AI assistant to manage events and coordinate
- ❌ **Vendors:** Do NOT have AI chat assistants

**Where they appear:**
- Client Event Page: Chat interface on left side of split screen
- Venue Event Page: Chat interface in center/main area
- Sidebar: List of recent chat conversations for quick access

**What they can do:**
- Answer questions
- Make suggestions
- Execute actions (update data, create tasks, send messages)
- Remember past conversations
- Provide context-specific help

---

### 2. Messages (Human-to-Human)

**What they are:**
- Direct communication between people
- Traditional messaging like email or SMS
- Can include AI-generated suggestions for responses

**Who uses them:**
- Clients ↔ Venues
- Venues ↔ Vendors
- (Clients do NOT directly message vendors; venue mediates)

**Where they appear:**
- **Venue:** Dedicated Messages Page with list of threads
- **Vendor:** Dedicated Messages Page with list of threads
- **Client:** Messages sent via AI assistant (AI sends on client's behalf)

**What they're for:**
- Specific questions or requests
- Formal communication
- Vendor coordination
- Client inquiries that need direct attention

---

## Chat System Details

### Client Chat Interface

**What clients can do through their AI assistant:**
- Ask questions about their event
- Request changes to elements
- Get suggestions for vendors
- Manage their guest list
- View pricing and budget
- Review contracts
- Message the venue (AI sends on their behalf)

**Context the AI has:**
- Client's information and preferences
- Event details (date, venue, guest count, budget)
- Selected elements and their status
- Venue information and available services
- Past conversation history
- Past event history (if returning client)

**Example conversation:**
```
Client: "I think we need more vegetarian options for dinner"

AI: "I can help with that! Your current menu has one vegetarian 
option. Would you like me to ask the caterer about adding more? 
I can suggest:
- Vegetarian lasagna
- Stuffed portobello mushrooms
- Eggplant parmesan

Which would you prefer, or would you like to see all options?"

Client: "Show me all options"

AI: [Displays options with photos and pricing]

Client: "Let's add the portobello mushrooms"

AI: "Great choice! I'll send a request to the venue to confirm 
this addition with the caterer. The additional cost would be 
about $8 per vegetarian meal. You should hear back within 24 hours."

[AI creates task for venue to confirm with caterer]
```

---

### Venue Chat Interface

**What venues can do through their AI assistant:**
- Review event status across all events
- Get reminders about pending tasks
- Ask for summaries or reports
- Manage elements for events
- Coordinate vendor communications
- Send messages to clients or vendors
- Update event information

**Context the AI has:**
- Venue information
- All event details
- Client information for all events
- Vendor relationships and information
- Complete task list
- Full action history
- All message threads

**Example conversation:**
```
Venue: "What's the status of the Smith wedding?"

AI: "The Smith wedding is on October 15. Current status:
✓ Venue rental - confirmed
✓ Catering - confirmed (Bella's Catering)
🟡 Photography - waiting for vendor confirmation
⚫ Flowers - client reviewing options
You have 1 pending task: Confirm final catering count by Oct 8"

Venue: "Send a reminder to the photographer"

AI: "I'll send a message to Lens & Light Photography asking 
for confirmation. Would you like me to mention any specific 
deadline?"

Venue: "Yes, we need confirmation by Friday"

AI: "Done! I've sent the message with a Friday deadline and 
created a follow-up task in case we don't hear back."
```

---

### Why Vendors Don't Have AI Chat

**Design Decision:**
Vendors are service providers working with multiple venues. Their needs are different:

**What vendors need:**
- Clear specifications for what's being requested
- Ability to respond to specific requests
- Simple, direct communication

**What they don't need:**
- AI assistant asking them questions
- Another "interface" to learn
- Complex conversation management

**Instead, vendors:**
- Receive clear messages from venue AI representatives
- View straightforward event specifications
- Respond directly through message threads
- Complete structured forms when needed

---

## Message System Details

### Message Threading

**How messages are organized:**
- Messages are grouped into **threads**
- Each thread has a subject and list of participants
- Threads are associated with events (usually)
- All messages in a thread appear together

**Thread participants:**
- Venue + Client (most common)
- Venue + Vendor (for coordination)
- Never Client + Vendor directly (venue mediates)

### Message Components

**Each message includes:**
- Sender information
- Recipient information
- Content (text)
- Attachments (optional)
- Timestamp
- Read/unread status
- Associated event (if applicable)
- "Action required" flag (for urgent items)

---

## Venue Message Interface

### Messages Page (List View)

**Shows all message threads with:**
- Sender name and type (client or vendor)
- Subject/event name
- Preview of latest message
- Timestamp
- Unread indicator (dot or badge)
- "Action Required" flag (for urgent items)

**Filtering options:**
- All messages
- Unread only
- By event
- By sender type (clients vs vendors)
- Search by keyword

---

### Message Thread (Detail View)

**Layout has three sections:**

**1. Header:**
- Back button to Messages page
- Thread subject
- Participant names

**2. Message History (Left/Center):**
- All messages in chronological order
- Clear sender identification
- Timestamps
- Attachments
- Thread continuity

**3. Suggested Actions (Right Sidebar):**
- AI-generated suggestions based on latest message
- Quick action buttons (Accept, Decline, etc.)
- May include forms for structured responses
- Updates dynamically as conversation progresses

**4. Message Input (Bottom):**
- Text input area
- Suggested reply (AI-generated, optional to use)
- "Use This" button to accept suggestion
- Suggestion disappears if you start typing
- Attach files button
- Send button

---

### AI-Assisted Messaging Features

#### Suggested Replies

**What they are:**
When viewing a message, the venue's AI assistant analyzes it and suggests an appropriate response.

**Characteristics:**
- Professional and friendly tone
- Addresses the message content
- Concise (2-3 sentences typically)
- Includes next steps if applicable
- Appears in message input field
- Can be used as-is or modified
- Disappears if you click to type your own

**Example:**
Client message: "Can we move the cocktail hour to the garden?"

Suggested reply: "Great idea! The garden would be perfect for cocktail hour. Let me confirm it's available for your date and get back to you by tomorrow."

#### Suggested Actions

**What they are:**
Clickable actions the venue can take based on the message content.

**Examples of suggested actions:**
- "Accept Change Request" → Opens form to approve with details
- "Update Element Status" → Quick status change
- "Create Task for Vendor" → Generates vendor task
- "Add Note to Event" → Saves important info
- "Schedule Follow-up" → Creates reminder task

**How they work:**
- Appear as buttons in the sidebar
- May open a form if more info needed
- Execute the action when clicked
- Update the event/system automatically
- May send follow-up messages

---

## AI-Initiated Messages

### When AI Sends Messages on Behalf of Users

The AI assistants can send messages on behalf of users in certain situations:

#### Client AI → Venue

**When:**
- Client requests something through chat
- Client asks to "tell the venue" something
- Client approves/rejects something
- Automated reminders or confirmations

**Example:**
Client tells their AI: "Can we add another table?"
→ AI creates message thread to venue: "Client requests to add one additional table to their event. Current count: 15 tables for 150 guests."

#### Venue AI → Vendor

**When:**
- Venue asks AI to contact vendor
- Client request needs vendor action
- Automated confirmations or requests

**Example:**
Venue tells their AI: "Ask the florist about pink roses"
→ AI creates message thread to florist: "For the Smith wedding on Oct 15, the client would like to explore adding pink roses to the arrangements. Can you provide options and pricing?"

#### Venue AI → Client

**When:**
- Status updates
- Confirmations
- Responses to client requests

**Example:**
After vendor confirms: AI sends to client: "Good news! The florist confirmed they can add pink roses to your arrangements for an additional $150. Would you like to approve this change?"

---

## Message Notifications

### When Users Get Notified

**New message received:**
- Always: In-app notification (badge count)
- Optional: Email notification (based on preferences)
- Optional: SMS for urgent/action-required messages

**Notification preferences:**
Users can configure:
- Email immediately / hourly digest / daily digest / never
- In-app notifications on/off
- SMS for urgent only / all messages / never

### Notification Content

**In-app:**
- Sender name
- Event name (if applicable)
- Message preview (first 100 characters)
- Click to open thread

**Email:**
- Full message content
- Event context
- Link to respond
- Option to reply via email (future feature)

**SMS (urgent only):**
- Brief notification
- Sender and event
- Link to open message

---

## Real-Time Updates

### Live Message Updates

**What updates in real-time:**
- New messages appear instantly
- Unread counts update
- Typing indicators (future)
- Read receipts (future)
- Thread updates

**Technology:**
Uses Supabase real-time subscriptions or WebSockets to push updates to connected clients without page refresh.

**User experience:**
- No need to refresh page
- Messages appear as they're sent
- Notification badges update live
- Smooth, modern messaging feel

---

## Message Search and Filtering

### Search Features

**Search by:**
- Message content (full-text search)
- Sender name
- Event name
- Date range

**Filter by:**
- Event (specific event or all events)
- Sender type (client or vendor)
- Read/unread status
- Action required flag
- Date range

### Use Cases

**Find specific information:**
"What did the client say about flowers?"
→ Search messages for "flowers"

**Review vendor communications:**
Filter: Vendors only, specific event
→ See all vendor coordination for event

**Check unread messages:**
Filter: Unread only
→ See what needs attention

---

## Mass Messaging

### Messaging All Guests

**Venue capability:**
Venues can send a message to all guests for an event.

**Use cases:**
- Event updates or changes
- Parking instructions
- Weather alerts
- Thank you messages after event

**How it works:**
1. Venue selects event
2. Clicks "Message All Guests"
3. Composes message
4. Reviews recipient list
5. Sends
6. All guests receive email

**Not spam:**
- Only event-related communications
- Guests expect these messages
- Opt-out available
- Logged and tracked

---

## Message Management

### Archiving

**Purpose:** Hide old threads without deleting them

**How it works:**
- User archives a thread
- Thread removed from main list
- Still searchable
- Can be unarchived anytime

**Use cases:**
- Completed events
- Resolved conversations
- Keeping inbox clean

### Deleting

**Purpose:** Remove unwanted messages

**How it works:**
- Soft delete (not permanent immediately)
- Removed from user's view
- Kept for audit trail
- Permanently deleted after 90 days

**Use cases:**
- Spam or mistakes
- Irrelevant messages
- Privacy concerns

---

## Message vs Task Distinction

### When to Use Messages

**Use messages for:**
- Informal questions
- Back-and-forth discussion
- Clarifications
- Updates
- Relationship building

**Example:**
"Hi! Just wanted to confirm you received the updated menu?"

### When to Use Tasks

**Use tasks for:**
- Structured decisions
- Formal approvals
- Specific actions required
- Deadline-driven items
- Forms or checklists

**Example:**
"Task: Approve updated menu pricing - Due: Oct 8"

### Messages Can Create Tasks

A message conversation might lead to a task:

1. Client messages: "Can we change the menu?"
2. Venue responds: "Let me check with the caterer"
3. System creates task: "Review menu change request"
4. Task includes form for vendor to respond
5. Once complete, message sent back to client

---

## Chat vs Message Distinction Summary

### Use Chats (AI) When:
- User needs help or guidance
- Questions about options
- Planning and decision-making
- Learning about the platform
- Getting recommendations
- Taking actions through assistant

### Use Messages When:
- Humans need to talk to other humans
- Formal communication
- Vendor coordination
- Specific questions requiring human judgment
- Building relationships
- Urgent matters requiring human attention

---

## Best Practices

### For Clear Communication

**Subject lines:**
- Include event name
- Be specific
- Keep it brief

**Message content:**
- Get to the point quickly
- Use paragraphs for readability
- Include relevant details
- Specify deadlines clearly
- Be professional but friendly

**Attachments:**
- Name files clearly
- Include version numbers if applicable
- Mention attachments in message text

### For Venues

**Responding to clients:**
- Respond within 24 hours
- Use suggested replies when appropriate
- Be warm and professional
- Set clear expectations
- Confirm actions taken

**Coordinating with vendors:**
- Be specific about requirements
- Include all necessary details
- Set clear deadlines
- Follow up if no response
- Document agreements

### For Vendors

**Responding to venues:**
- Respond promptly (within 24 hours)
- Answer all questions asked
- Be clear about pricing
- Confirm availability
- Ask for clarification if needed

---

## Analytics and Monitoring

### Useful Metrics

**For platform:**
- Message response times
- Messages per event
- Unread message rates
- Search usage patterns

**For venues:**
- Average response time
- Open message threads
- Unread count
- Messages by event

**For product improvement:**
- Which suggested replies are used?
- Which suggested actions are popular?
- Where do users struggle?
- What questions are common?

---

## Security and Privacy

### Message Privacy

**Who can see messages:**
- Only the participants in the thread
- System admins (for support only)
- Not other clients or vendors

**Message retention:**
- Active threads: Indefinite
- Completed events: 2 years
- Deleted messages: 90 days then purged
- Audit logs: Indefinite

### Secure Communication

**Security measures:**
- Encrypted in transit (TLS)
- Encrypted at rest
- Access controls (RLS)
- Audit logging
- No third-party access

---

## Future Enhancements

**v1.1+:**
- Voice messages
- Video messages
- Rich text formatting (bold, italic, lists)
- Emoji reactions to messages
- Message editing (within 5 minutes)
- Message threading/replies
- @mentions for team members
- Read receipts
- Typing indicators
- Message templates (save frequent responses)
- Scheduled messages (send later)
- Message translations (multi-language)
- Group messages (multiple participants)
- Integration with SMS/WhatsApp
- Reply via email functionality
- Message forwarding