# Venue Interface Specifications

## Overview

The venue interface is designed for professional event coordinators managing multiple events, vendors, and client relationships. It includes an AI assistant to help with coordination and decision-making.

**Layout Pattern:** Similar to Claude's interface with a persistent sidebar and main content area.

---

## Sidebar Navigation

**Persistent Left Sidebar:**
- Venue Profile
- Spaces
- Calendar
- Events
- Messages
- Tasks
- Vendors
- Offerings

**Below Navigation:**
- List of recent chats with AI assistant
- Displayed as cards with:
  - Conversation preview
  - Timestamp
  - Associated event (if any)

---

## Venue Profile Page

**Purpose:** Manage venue's basic information

**Layout:**
```
┌─────────────────────────────────────────┐
│ Venue Profile                           │
├─────────────────────────────────────────┤
│                                         │
│ Business Information                    │
│ ─────────────────────                   │
│ Venue Name: [____________]              │
│ Description: [____________]             │
│              [____________]             │
│                                         │
│ Contact Information                     │
│ ─────────────────────                   │
│ Email: [____________]                   │
│ Phone: [____________]                   │
│                                         │
│ Address                                 │
│ ─────────────────────                   │
│ Street: [____________]                  │
│ City: [____________]                    │
│ State: [__] ZIP: [_____]                │
│                                         │
│ Booking Settings                        │
│ ─────────────────────                   │
│ Booking Page URL: [slug].platform.com   │
│ [Edit Slug]                             │
│                                         │
│ Lead Time: [__] days minimum            │
│ Max Advance Booking: [__] months        │
│                                         │
│ [Cancel] [Save Changes]                 │
└─────────────────────────────────────────┘
```

**Features:**
- Edit all business information
- Customize booking page URL slug
- Configure booking rules
- Upload venue logo
- Add social media links
- Business hours

---

## Spaces Page

**Purpose:** Manage event spaces within the venue

**Layout:**
```
┌─────────────────────────────────────────┐
│ Spaces                      [+ New Space]│
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [Image]  Main Ballroom              │ │
│ │          Capacity: 150              │ │
│ │          5 upcoming events           │ │
│ │                          [Edit]     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [Image]  Garden Terrace             │ │
│ │          Capacity: 80               │ │
│ │          2 upcoming events           │ │
│ │                          [Edit]     │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**Space Card Details:**
- Main image thumbnail
- Space name
- Capacity
- Number of upcoming events
- Edit button

**Edit/Create Space Modal:**
```
┌─────────────────────────────────────────┐
│ Edit Space: Main Ballroom               │
├─────────────────────────────────────────┤
│                                         │
│ Space Name: [____________]              │
│ Description: [____________]             │
│              [____________]             │
│ Capacity: [____] guests                 │
│                                         │
│ Main Image: [Current Image Preview]     │
│             [Upload New]                │
│                                         │
│ Photo Gallery:                          │
│ [Photo 1] [Photo 2] [Photo 3]           │
│ [+ Add Photos]                          │
│                                         │
│ Floor Plan:                             │
│ [Current Floor Plan Preview]            │
│ [Upload New]                            │
│                                         │
│ [Delete Space] [Cancel] [Save]          │
└─────────────────────────────────────────┘
```

---

## Calendar Page

**Purpose:** View all events and deadlines across spaces

**Layout:**
```
┌─────────────────────────────────────────┐
│ Calendar                                │
│ [Month ▼] [Week] [Day]   Filter: [All ▼]│
├─────────────────────────────────────────┤
│                                         │
│     October 2025                        │
│ Su  Mo  Tu  We  Th  Fr  Sa              │
│              1   2   3   4              │
│  5   6   7   8   9  10  11              │
│ 12  13  14 [15] 16  17  18              │
│ 19  20  21  22  23  24  25              │
│ 26  27  28  29  30  31                  │
│                                         │
│ Legend:                                 │
│ ● Main Ballroom                         │
│ ● Garden Terrace                        │
│ ● Corporate Suite                       │
│                                         │
│ Upcoming Deadlines:                     │
│ • Contract due: Smith Wedding           │
│ • Deposit due: Johnson Corp Event       │
│ • Final headcount: Martinez Party       │
└─────────────────────────────────────────┘
```

**Features:**
- Month/Week/Day views
- Color-coded by space
- Filter by space or event
- Shows events and deadlines
- Click event to open Event Page
- Drag to reschedule (with confirmation)
- Export calendar
- Sync with Google Calendar (future)

**Calendar uses a robust pre-built component** (e.g., FullCalendar, React Big Calendar)

---

## Events Page

**Purpose:** Overview of all events requiring attention

**Layout:**
```
┌─────────────────────────────────────────┐
│ Events                                  │
│ [All ▼] [This Month ▼] [Search...]      │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ⚠️  Smith Wedding                    │ │
│ │ Oct 15, 2025 • Main Ballroom         │ │
│ │ 3 items need attention               │ │
│ │ • Contract pending signature         │ │
│ │ • Catering needs confirmation        │ │
│ │ • Guest count overdue                │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ✓  Johnson Corp Event                │ │
│ │ Oct 22, 2025 • Garden Terrace        │ │
│ │ All items on track                   │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**Event Card Shows:**
- Event name
- Date and space
- Status indicator (⚠️ needs attention, ✓ on track, 🟡 in progress)
- List of items requiring attention
- Click to open Event Page

**Filters:**
- Status (All, Needs Attention, On Track, Completed)
- Time range (This Week, This Month, Next 3 Months, Custom)
- Space
- Client name

---

## Messages Page

**Purpose:** View all message threads with clients and vendors

**Layout:**
```
┌─────────────────────────────────────────┐
│ Messages                   [Compose]    │
│ [All ▼] [Unread] [Search...]            │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ● Jane Smith                         │ │
│ │   Re: Smith Wedding - Oct 15         │ │
│ │   Can we change the flower colors?   │ │
│ │   2 hours ago          🔴 Action Req │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │   Bella's Catering (Vendor)          │ │
│ │   Re: Johnson Corp Event             │ │
│ │   Menu finalized and ready           │ │
│ │   Yesterday                          │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**Message Thread Preview Shows:**
- Sender name (client or vendor)
- Associated event name
- Message preview
- Timestamp
- Unread indicator (●)
- Action required flag (🔴)

**Clicking a message** opens the Message Page (individual thread)

---

## Message Page (Individual Thread)

**Purpose:** View and respond to a specific message thread

**Layout:**
```
┌─────────────────────────────────────────┐
│ [← Messages]  Jane Smith                │
│ Re: Smith Wedding - Oct 15              │
├──────────────────────┬──────────────────┤
│                      │                  │
│ Message Thread       │ Suggested Actions│
│                      │                  │
│ [Jane Smith]         │ ┌──────────────┐ │
│ Can we change the    │ │ Change       │ │
│ flower colors to     │ │ Request:     │ │
│ more pink?           │ │ Flowers      │ │
│ 2 hours ago          │ │              │ │
│                      │ │ [Accept]     │ │
│ [Venue AI]           │ │ [Decline]    │ │
│ I'll check with the  │ │ [Modify]     │ │
│ florist about pink   │ └──────────────┘ │
│ options!             │                  │
│ 1 hour ago           │                  │
│                      │                  │
│ [Jane Smith]         │                  │
│ Thank you!           │                  │
│ 30 min ago           │                  │
│                      │                  │
├──────────────────────┴──────────────────┤
│ Suggested reply: "The florist can...    │
│ [Use This] [Type your own message...]   │
└─────────────────────────────────────────┘
```

**Features:**
- Thread view of all messages
- Suggested actions panel (right side)
  - AI-generated based on context
  - Quick accept/decline buttons
  - Opens relevant forms/dialogs
- Suggested reply text
  - Click "Use This" to insert
  - Disappears if you start typing
- Message field for manual replies
- Attach files
- @mention team members (future)

### Venue AI Assistant Context (Message Page):
- Client Info
- Event Info
- Event Action History (Last 10 actions)
- Venue Info
- Venue Task List
- Vendors Info
- Client message content

### Venue AI Assistant Tools (Message Page):
- Add Element
- Update Element
- Remove Element
- Message Vendor
- Message Client
- Message Guests
- Update Suggested Message
- See full event history
- Create Task

---

## Event Page (Venue View)

**Purpose:** Manage a specific event in detail

**Layout:** Very similar to client-facing event page

```
┌─────────────────────────────────────────┐
│ [← Events]  Smith Wedding               │
│ October 15, 2025 • Main Ballroom        │
├────────────────────┬────────────────────┤
│                    │                    │
│ Chat with AI       │ Event Card         │
│ Assistant          │                    │
│                    │ Client: Jane Smith │
│ [Chat history]     │ Date: Oct 15       │
│                    │ Guests: 150        │
│ [Chat input...]    │ Budget: $15,000    │
│                    │                    │
│                    │ ─────────────────  │
│                    │                    │
│                    │ Elements:          │
│                    │ ⚫ Venue Rental     │
│                    │ 🟡 Catering        │
│                    │ 🟢 Photography     │
│                    │ ❗ Flowers         │
│                    │                    │
│                    │ [View Contract]    │
│                    │ [View Guests]      │
│                    │                    │
└────────────────────┴────────────────────┘
```

**Key Differences from Client View:**
- Elements are **directly editable**
- Can change element status
- Can add files to elements
- Can assign vendors
- Can update pricing
- Can add internal notes

**Element Expanded View (Venue):**
```
┌─────────────────────────────────────────┐
│ Catering                                │
├─────────────────────────────────────────┤
│ Status: [In Progress ▼]                 │
│ Vendor: [Bella's Catering ▼]            │
│ Price: $[____]                          │
│                                         │
│ Description:                            │
│ [________________________]              │
│                                         │
│ Files:                                  │
│ 📄 Menu_Final.pdf                       │
│ 📄 Contract_Signed.pdf                  │
│ [+ Upload File]                         │
│                                         │
│ Internal Notes:                         │
│ [________________________]              │
│                                         │
│ Client Notes:                           │
│ [________________________]              │
│                                         │
│ [Message Vendor] [Save Changes]         │
└─────────────────────────────────────────┘
```

---

## Guests Page (Venue View)

**Purpose:** View guest list for planning purposes

**Layout:** Similar to client view but **read-only**

```
┌─────────────────────────────────────────┐
│ [← Back to Event]  Guests (142/150)     │
├─────────────────────────────────────────┤
│                                         │
│ RSVP Summary:                           │
│ ✓ Yes: 142  ✗ No: 8  ? Pending: 0      │
│                                         │
│  Name            Email      RSVP Dietary│
│  ─────────────────────────────────────  │
│  Jane Smith      jane@...   ✓    None   │
│  John Doe        john@...   ✓    Vegan  │
│  Sarah Johnson   sarah@...  ✓    GF     │
│  ...                                    │
│                                         │
│ [Export Guest List] [Download Seating]  │
└─────────────────────────────────────────┘
```

**Features:**
- View-only access
- RSVP summary
- Dietary restrictions visible
- Export functionality
- Filter by RSVP status or dietary needs

---

## Contract/Billing Page (Venue View)

**Purpose:** Track payments and contract status

**Layout:**
```
┌─────────────────────────────────────────┐
│ [← Back to Event]  Contract & Billing   │
├─────────────────────────────────────────┤
│                                         │
│ VENUE RENTAL                            │
│ Main Ballroom (8 hours)                 │
│ Due: Oct 1 │ Status: 🟢 Paid           │
│ $2,500.00                               │
│ Paid: Oct 1, 2025 via Stripe            │
│ ─────────────────────────────────────── │
│                                         │
│ CATERING                                │
│ Dinner service for 150 guests           │
│ Deposit due: Oct 8 │ Status: 🟡 Partial│
│ $8,750.00 (50% paid)                    │
│ [Mark as Paid]                          │
│ ─────────────────────────────────────── │
│                                         │
│ ┌───────────────────────────────────┐   │
│ │ TOTAL                             │   │
│ │ Paid: $6,875.00                   │   │
│ │ Outstanding: $4,375.00            │   │
│ │ GRAND TOTAL: $11,250.00           │   │
│ └───────────────────────────────────┘   │
│                                         │
│ [Generate Invoice] [Send Reminder]      │
└─────────────────────────────────────────┘
```

**Features:**
- Track all payments
- Mark payments as received
- Generate invoices
- Send payment reminders
- Payment history
- Deposit rules visible

---

## Tasks Page

**Purpose:** View and manage all tasks across events

**Layout:**
```
┌─────────────────────────────────────────┐
│ Tasks                        [7 Pending]│
│ [All ▼] [Due Soon ▼] [Search...]        │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🔴 Contract signature needed         │ │
│ │ Smith Wedding • Due in 2 days        │ │
│ │ [View Event] [Mark Complete]         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🟡 Confirm catering headcount        │ │
│ │ Johnson Event • Due in 5 days        │ │
│ │ [View Event] [Mark Complete]         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ✓ Photography deposit received       │ │
│ │ Martinez Party • Completed           │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**Task Card Shows:**
- Priority/urgency indicator (🔴 urgent, 🟡 normal, ✓ complete)
- Task name
- Associated event
- Due date
- Action buttons

**Clicking Task:**
- Opens associated Event Page
- Highlights relevant element/section
- Shows task details in overlay

**Task Detail Overlay:**
```
┌─────────────────────────────────────────┐
│ Task: Confirm catering headcount        │
├─────────────────────────────────────────┤
│ Event: Johnson Corp Event               │
│ Due: October 17, 2025                   │
│ Priority: High                          │
│                                         │
│ Description:                            │
│ Client needs to provide final           │
│ headcount to caterer by this date.      │
│                                         │
│ [Form fields if applicable]             │
│                                         │
│ [Cancel] [Mark Complete]                │
└─────────────────────────────────────────┘
```

**Filters:**
- Status (Pending, In Progress, Completed)
- Priority (Urgent, High, Normal, Low)
- Due date (Overdue, Today, This Week, This Month)
- Event

---

## Vendors Page

**Purpose:** Manage approved vendor relationships

**Layout:**
```
┌─────────────────────────────────────────┐
│ Vendors                  [+ Invite Vendor]│
│ [All ▼] [By Category ▼] [Search...]     │
├─────────────────────────────────────────┤
│                                         │
│ Catering                                │
│ ┌─────────────────────────────────────┐ │
│ │ Bella's Catering                     │ │
│ │ ✓ Approved • COI expires: 12/2025    │ │
│ │ 5 offerings • 3 active events        │ │
│ │              [View] [Message]        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Photography                             │
│ ┌─────────────────────────────────────┐ │
│ │ Lens & Light Photography             │ │
│ │ ⏳ Pending approval                  │ │
│ │ 8 offerings • COI uploaded           │ │
│ │              [Review] [Message]      │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**Vendor Card Shows:**
- Vendor name
- Approval status
- COI expiration date
- Number of offerings
- Number of active events
- Action buttons

**Invite Vendor Flow:** (See onboarding-flows.md)

**View Vendor Details:**
```
┌─────────────────────────────────────────┐
│ [← Vendors]  Bella's Catering           │
├─────────────────────────────────────────┤
│ Contact: bella@example.com              │
│ Phone: (555) 123-4567                   │
│ Status: ✓ Approved                      │
│                                         │
│ Certificate of Insurance                │
│ Expires: December 31, 2025              │
│ Coverage: $2,000,000                    │
│ 📄 COI_Document.pdf                     │
│                                         │
│ Offerings (5)                           │
│ ─────────────────────                   │
│ • Buffet Service - $45/person           │
│ • Plated Dinner - $65/person            │
│ • Cocktail Hour - $25/person            │
│ • Bar Service - $500 flat               │
│ • Dessert Bar - $15/person              │
│                                         │
│ Active Events (3)                       │
│ ─────────────────────                   │
│ • Smith Wedding - Oct 15                │
│ • Johnson Corp - Oct 22                 │
│ • Martinez Party - Nov 5                │
│                                         │
│ [Message Vendor] [Edit Approval]        │
└─────────────────────────────────────────┘
```

---

## Offerings Page

**Purpose:** Manage venue's own services and elements

**Layout:**
```
┌─────────────────────────────────────────┐
│ Offerings                [+ New Offering]│
│ [All Categories ▼] [Search...]          │
├─────────────────────────────────────────┤
│                                         │
│ Venue Rental                            │
│ ┌─────────────────────────────────────┐ │
│ │ [Image] Main Ballroom Rental         │ │
│ │         $2,500 (8 hours)             │ │
│ │         Lead time: 30 days           │ │
│ │                          [Edit]      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Equipment                               │
│ ┌─────────────────────────────────────┐ │
│ │ [Image] Basic AV Setup               │ │
│ │         $350                         │ │
│ │         Lead time: 7 days            │ │
│ │                          [Edit]      │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**Edit/Create Offering:**
```
┌─────────────────────────────────────────┐
│ Edit Offering: Main Ballroom Rental     │
├─────────────────────────────────────────┤
│ Name: [____________]                    │
│ Category: [Venue Rental ▼]              │
│ Base Price: $[____]                     │
│                                         │
│ Description:                            │
│ [________________________]              │
│ [________________________]              │
│                                         │
│ Images:                                 │
│ [Image 1] [Image 2] [Image 3]           │
│ [+ Upload Images]                       │
│                                         │
│ Files (menus, specs, etc.):             │
│ 📄 Ballroom_Specs.pdf                   │
│ [+ Upload Files]                        │
│                                         │
│ Availability Rules:                     │
│ Lead Time: [__] days required           │
│ Blackout Dates: [Add dates...]          │
│                                         │
│ Seasonal Pricing: (optional)            │
│ [+ Add Seasonal Rule]                   │
│                                         │
│ [Delete] [Cancel] [Save]                │
└─────────────────────────────────────────┘
```

---

## Design Guidelines

### Visual Hierarchy
- High priority tasks and alerts prominent
- Color coding consistent throughout
- Clear status indicators
- Scannable layouts

### Responsive Design
- Desktop-first for venue coordinators
- Tablet support for on-site coordination
- Mobile view for quick checks

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- High contrast mode

### Performance
- Real-time updates without page refresh
- Optimistic UI updates
- Skeleton loading states
- Efficient re-renders

---

## Future Enhancements

**v1.1+:**
- Team member management
- Permission levels
- Analytics dashboard
- Revenue tracking
- Automated reporting
- Calendar sync (Google, Outlook)
- Bulk actions
- Advanced filtering
- Template events
- Commission tracking for vendors