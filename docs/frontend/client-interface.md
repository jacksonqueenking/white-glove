# Client Interface Specifications

## Overview

The client interface is designed to be simple, intuitive, and AI-assisted. Clients interact primarily through natural conversation with an AI assistant that helps them plan their event.

**Key Principle:** If a client has only one event, they go directly to the Event Page. No events list is shown until they have multiple events.

## Layout Pattern

Client views follow the **Claude Projects split-screen pattern**:
- **Left side:** Chat interface with AI assistant
- **Right side:** Event information and details

## Event Page

### Left Side - Chat Interface

**Header:**
- Event name (prominent, top-aligned)
- Event description (if provided)

**Chat Area:**
- Chat input field for conversing with AI assistant
- Conversation history displayed chronologically
- AI responses with clear visual distinction from user messages
- Loading states during AI processing

**Chat History List:**
- Below the active chat area
- Previous conversations displayed as horizontal cards
- Each card shows:
  - Date/time of conversation
  - Brief preview of conversation topic
  - Three-dot menu for actions:
    - Archive
    - Delete
    - (Future: Share, Export)

### Right Side - Event Card

**Header Section:**
```
┌─────────────────────────────────────┐
│ [Venue Name]                        │
│ [Event Date]          [📅 Calendar] │
├─────────────────────────────────────┤
```

- Venue name (clickable to view venue details?)
- Event date and time
- Calendar icon button (opens date picker to reschedule?)

**Elements Stack:**

Below the header, a scrollable list of event elements:

```
┌─────────────────────────────────────┐
│ ⚫ Venue Rental                      │ ← Red dot (to-do)
│ 🟡 Catering                          │ ← Yellow dot (in progress)
│ 🟢 Photography                       │ ← Green dot (completed)
│ ❗ Floral Arrangements               │ ← Exclamation (needs attention)
│ ⚫ DJ Services                       │
└─────────────────────────────────────┘
```

**Status Indicators:**
- **Red dot (●):** To-do - not yet addressed
- **Yellow dot (●):** In progress - being worked on
- **Green dot (●):** Completed - finalized
- **Exclamation icon (❗):** Needs attention - action required (replaces color dot)

**Element Interaction:**
- Click element name to expand
- Expanded element occupies bottom half of event card
- Expanded view shows:
  - Element name (header)
  - Description
  - Price (clearly displayed)
  - Vendor (if not provided by venue)
  - Status (descriptive text)
  - Notes section
  - Action buttons (if applicable): "Approve", "Request Change", "View Options"

**Action Buttons:**
- Primary action button at bottom of event card
- "View Contract" button
- "Manage Guests" button

---

## Guests Page

Accessed via button on Event Page. Replaces event card with guest management interface.

**Layout:**
```
┌─────────────────────────────────────┐
│ [← Back to Event]  Guests (23/150)  │
├─────────────────────────────────────┤
│ [+ Add Guest] [📤 Import CSV]       │
├─────────────────────────────────────┤
│                                     │
│  Name            Email      RSVP    │
│  ─────────────────────────────────  │
│  ○ Jane Smith    jane@...   ✓ Yes  │
│  ○ John Doe      john@...   ✗ No   │
│  ○ Sarah Johnson sarah@...  ? TBD  │
│  ...                                │
└─────────────────────────────────────┘
```

**Features:**
- Guest count (RSVPed / Total invited)
- Add guest manually (form modal)
- Import guest list from CSV
- Guest list table with columns:
  - Selection checkbox
  - Name (editable inline)
  - Title (optional)
  - Email
  - Phone (optional)
  - RSVP Status (Yes/No/Undecided)
  - Dietary restrictions (icon if present)
  - Notes (icon if present)
- Click row to edit guest details
- Bulk actions: Send invitations, Send reminders, Delete
- Filter by RSVP status
- Search by name/email

**Guest Form (Add/Edit):**
```
Name: [____________]
Title: [____________] (optional)
Email: [____________]
Phone: [____________] (optional)
Dietary Restrictions: [____________] (optional)
Notes: [____________] (optional)
Plus One: [ ] Allow plus one

[Cancel] [Save]
```

**Send Invitations:**
- Select guests (or all)
- Click "Send Invitations"
- Preview email template (customizable)
- Confirm send
- Guests receive email with RSVP link

---

## Guest RSVP Portal

**Note:** Guests do NOT log in. They access via magic link in invitation email.

**Layout:**
```
┌─────────────────────────────────────┐
│  You're Invited!                    │
│                                     │
│  [Event Name]                       │
│  [Date] at [Venue]                  │
│                                     │
│  Will you attend?                   │
│  ● Yes, I'll be there               │
│  ○ No, I can't make it              │
│                                     │
│  Name: [Pre-filled]                 │
│  Email: [Pre-filled]                │
│                                     │
│  Dietary Restrictions:              │
│  [_____________________]            │
│                                     │
│  Additional Notes:                  │
│  [_____________________]            │
│                                     │
│  [Submit RSVP]                      │
└─────────────────────────────────────┘
```

**After Submission:**
- Confirmation message
- Calendar invite (optional download)
- RSVP status updates in client's guest list in real-time

---

## Contract/Billing Page

Accessed via "View Contract" button on Event Page. Replaces event card with contract view.

**Layout:**
```
┌─────────────────────────────────────┐
│ [← Back to Event]  Contract & Billing│
├─────────────────────────────────────┤
│                                     │
│ VENUE RENTAL                        │
│ Main Ballroom (8 hours)             │
│ Due: [Date] │ Status: ⚫ Unpaid     │
│ $2,500.00               [Pay Now]   │
│ ─────────────────────────────────── │
│                                     │
│ CATERING                            │
│ Dinner service for 150 guests       │
│ Due: [Date] │ Status: 🟢 Paid      │
│ $8,750.00                  [Paid ✓]│
│ ─────────────────────────────────── │
│                                     │
│ PHOTOGRAPHY                         │
│ 6-hour coverage + album             │
│ Deposit due: [Date] │ Status: 🟡   │
│ $1,200.00 (50% deposit)  [Pay Now] │
│ ─────────────────────────────────── │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ TOTAL                         │   │
│ │ Paid: $8,750.00               │   │
│ │ Outstanding: $3,700.00        │   │
│ │ GRAND TOTAL: $12,450.00       │   │
│ └───────────────────────────────┘   │
│                                     │
│ [Download Contract] [View History]  │
└─────────────────────────────────────┘
```

**Features:**
- Element-by-element breakdown
- Description of each element
- Payment schedule (deposit, installments, final)
- Payment status indicators
- "Pay Now" buttons (Stripe integration)
- Total calculations
- Payment history link
- Download contract as PDF
- Email contract to self

**Payment Flow:**
1. Click "Pay Now"
2. Modal/redirect to Stripe Checkout
3. Enter payment info
4. Process payment
5. Confirmation screen
6. Status updates in real-time
7. Receipt emailed

---

## AI Assistant Context

The client's AI assistant has access to:

**Client Information:**
- Name, contact info
- Preferences (people, food, notes)
- Past events (if any)
- Communication history

**Venue Information:**
- Name, description, address
- Available elements/services
- Pricing
- Policies and restrictions
- Space details and photos

**Event Information:**
- Name, description, date
- Selected spaces
- Current element selections and status
- Guest count
- Budget
- Conversation history
- Task history
- Action history

**Contextual Awareness:**
- What has been discussed
- What has been decided
- What needs attention
- Upcoming deadlines
- Budget constraints

---

## AI Assistant Tools

The client's AI assistant can perform these actions:

### Memory & Personalization
- **Update Event Memory:** Store important details from conversation
- **Update Client Info:** Update preferences, contact info

### Element Management
- **Get Vendor Options for Element:** Search available vendors for a service
- **Select Vendor Option:** Choose a specific vendor's offering
- **Create Element:** Add a new element to the event
- **Select Element:** Choose an element from venue's offerings
- **Request to Update Element:** Ask for modifications (requires venue/vendor confirmation)

### Communication
- **Message Venue:** Send message to venue's AI assistant

### Information Retrieval
- **View Images:** Load and display images in context
  - Vendor images
  - Space images/floor plans
  - Element images and files
  - Venue images

### Workflow Actions
- **Create Task:** Generate task for client, venue, or vendor
- **Approve Task:** Mark task as completed
- **Request Information:** Ask venue/vendor for specific details

---

## Design Guidelines

### Visual Style
- Clean, modern aesthetic
- Plenty of whitespace
- Clear visual hierarchy
- Consistent with venue branding (future feature)

### Responsive Design
- Desktop-first, but mobile-friendly
- Breakpoints:
  - Mobile: < 768px (stack chat and event card)
  - Tablet: 768px - 1024px
  - Desktop: > 1024px (full split-screen)

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Color contrast ratios
- Focus indicators
- Alt text for images

### Loading States
- Skeleton screens for initial load
- Spinners for AI responses
- Progress indicators for file uploads
- Optimistic UI updates where appropriate

### Error Handling
- Inline validation messages
- Clear error descriptions
- Suggested fixes
- Retry mechanisms
- Graceful degradation

---

## Future Enhancements

**v1.1+:**
- Multiple events view/list
- Event comparison tools
- Mood boards/inspiration galleries
- Collaborative planning (multiple clients)
- Budget tracking visualizations
- Timeline/Gantt chart view
- Mobile app (PWA)
- Voice input for chat
- Image upload for inspiration