# Vendor Interface Specifications

## Overview

The vendor interface is streamlined for service providers who work with multiple venues. Vendors receive clear specifications, communicate through AI intermediaries, and manage their services per venue.

**Key Difference:** Vendors do NOT have AI chatbot assistants. They interact with venue AI representatives and view simplified event information relevant only to their services.

**Layout Pattern:** Sidebar navigation with main content area (simpler than venue interface).

---

## Sidebar Navigation

**Persistent Left Sidebar:**
- Messages
- Events
- Calendar
- Venues

---

## Messages Page

**Purpose:** View message threads with venues

**Layout:**
```
┌─────────────────────────────────────────┐
│ Messages                                │
│ [All ▼] [Unread] [Search...]            │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ● The Grand Ballroom                 │ │
│ │   Re: Smith Wedding catering         │ │
│ │   Menu customization request         │ │
│ │   2 hours ago          🔴 Action Req │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │   Riverside Events                   │ │
│ │   Re: Johnson Corp Event             │ │
│ │   Confirmed for Oct 22               │ │
│ │   Yesterday                          │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**Message Preview Shows:**
- Venue name (who they're communicating with)
- Event name/context
- Message preview
- Timestamp
- Unread indicator (●)
- Action required flag (🔴)

**Similar to venue's messages page**

---

## Message Thread

**Purpose:** Communicate with venue's AI representative

**Layout:**
```
┌─────────────────────────────────────────┐
│ [← Messages]  The Grand Ballroom        │
│ Re: Smith Wedding - Catering            │
├─────────────────────────────────────────┤
│                                         │
│ [Venue AI]                              │
│ The client would like to customize      │
│ the menu for the Smith Wedding. They    │
│ want more vegetarian options and        │
│ would like to substitute the chicken    │
│ for fish. Can you accommodate this?     │
│ 2 hours ago                             │
│                                         │
│ [You - Bella's Catering]                │
│ Yes, we can absolutely accommodate!     │
│ The fish option would be grilled        │
│ salmon at an additional $5/plate.       │
│ 1 hour ago                              │
│                                         │
│ [Venue AI]                              │
│ Perfect! I'll confirm with the client   │
│ about the price adjustment.             │
│ 30 minutes ago                          │
│                                         │
├─────────────────────────────────────────┤
│ [Type your message...]                  │
│                                         │
│ [Attach File]                  [Send]   │
└─────────────────────────────────────────┘
```

**Features:**
- Standard message thread
- Communication with venue's AI assistant
- File attachments
- Context about the event visible
- No suggested replies (vendor controls their own communication)

---

## Events Page

**Purpose:** View all events vendor is working on

**Layout:**
```
┌─────────────────────────────────────────┐
│ Events                                  │
│ [Upcoming ▼] [All Venues ▼] [Search...] │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Smith Wedding                        │ │
│ │ Oct 15, 2025 • The Grand Ballroom    │ │
│ │ Service: Catering (Buffet, 150)      │ │
│ │ ⚠️  Menu customization pending       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Johnson Corp Event                   │ │
│ │ Oct 22, 2025 • Riverside Events      │ │
│ │ Service: Catering (Plated, 80)       │ │
│ │ ✓  All confirmed                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Martinez Birthday Party              │ │
│ │ Nov 5, 2025 • The Grand Ballroom     │ │
│ │ Service: Dessert Bar (60)            │ │
│ │ 🟡 In planning                       │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**Event Card Shows:**
- Event name
- Date and venue
- Service(s) vendor is providing
- Status indicator
- What needs attention (if anything)

**Filters:**
- Time range (Upcoming, This Month, All)
- Venue (specific venue or all)
- Status (Needs Attention, Confirmed, In Progress)

---

## Event Page (Vendor View)

**Purpose:** View specifications and details for vendor's services

**Important:** Vendors see **only information relevant to them**, not the full event details.

**Layout:**
```
┌─────────────────────────────────────────┐
│ [← Events]  Smith Wedding               │
│ October 15, 2025 • The Grand Ballroom   │
├─────────────────────────────────────────┤
│                                         │
│ Event Details                           │
│ ─────────────                           │
│ Date: October 15, 2025                  │
│ Time: 6:00 PM - 11:00 PM                │
│ Venue: The Grand Ballroom               │
│ Guest Count: 150                        │
│                                         │
│ Your Service: Catering                  │
│ ─────────────                           │
│                                         │
│ ✓ Confirmed                             │
│   Buffet Dinner Service                 │
│   150 guests                            │
│   $6,750.00                             │
│                                         │
│   Specifications:                       │
│   • Buffet style service                │
│   • 3 protein options (chicken, beef,   │
│     vegetarian)                         │
│   • 4 sides                             │
│   • Salad bar                           │
│   • Rolls and butter                    │
│   • Coffee and tea service              │
│                                         │
│   Setup: 4:00 PM                        │
│   Service: 6:30 PM - 9:00 PM            │
│   Breakdown: 10:00 PM                   │
│                                         │
│   Client Notes:                         │
│   "Please label all dishes clearly for  │
│   dietary restrictions"                 │
│                                         │
│   Files:                                │
│   📄 Menu_Final.pdf                     │
│   📄 Setup_Instructions.pdf             │
│                                         │
│ ⚠️  Pending Decision                    │
│   Menu Customization Request            │
│                                         │
│   Client wants to substitute chicken    │
│   for grilled salmon and add more       │
│   vegetarian options.                   │
│                                         │
│   Your Response Needed:                 │
│   [Form or freeform response area]      │
│                                         │
│   [Submit Response]                     │
│                                         │
│ ─────────────────────────────────────── │
│                                         │
│ Communication History                   │
│ [Shows message thread with venue AI]    │
│                                         │
│ [Message Venue]                         │
└─────────────────────────────────────────┘
```

**What Vendors See:**
- Event date, time, location
- Guest count (if relevant)
- **Only their service specifications**
- Agreed pricing
- Timeline (setup, service, breakdown)
- Client notes relevant to their service
- Files/documents shared with them
- Pending requests/changes
- Communication history with venue

**What Vendors DON'T See:**
- Other vendors' information
- Full event budget
- Other elements/services
- Client's full guest list
- Client's personal information
- Venue's internal notes

**Pending Requests:**

When there's a pending decision, vendors see:
- What's being requested
- Context/reason
- Form to respond (if structured)
- Or message field (if freeform)

**Example Form for Menu Change:**
```
┌─────────────────────────────────────────┐
│ Menu Customization Request              │
├─────────────────────────────────────────┤
│ Can you substitute chicken for salmon?  │
│ ● Yes  ○ No                             │
│                                         │
│ If yes, price adjustment:               │
│ $[____] per plate                       │
│                                         │
│ Can you add 2 more vegetarian options?  │
│ ● Yes  ○ No                             │
│                                         │
│ If yes, which options:                  │
│ ☐ Vegetarian Lasagna                    │
│ ☐ Stuffed Portobello                    │
│ ☐ Eggplant Parmesan                     │
│ ☐ Other: [_________]                    │
│                                         │
│ Any additional notes:                   │
│ [________________________]              │
│                                         │
│ [Cancel] [Submit Response]              │
└─────────────────────────────────────────┘
```

---

## Calendar Page

**Purpose:** View vendor's schedule across all venues

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
│ Oct 15: Smith Wedding (Grand Ballroom)  │
│         Setup: 4PM, Service: 6:30PM     │
│                                         │
│ Oct 22: Johnson Event (Riverside)       │
│         Setup: 5PM, Service: 7PM        │
│                                         │
│ Upcoming Deadlines:                     │
│ • Menu finalization: Smith Wedding      │
│ • Headcount confirmation: Johnson Event │
└─────────────────────────────────────────┘
```

**Features:**
- Month/Week/Day views
- Shows events vendor is working on
- Setup and service times visible
- Deadlines and milestones
- Click event to open Event Page
- Export to calendar app
- Filter by venue

---

## Venues Page

**Purpose:** Manage relationships and offerings for each venue

**Layout:**
```
┌─────────────────────────────────────────┐
│ Venues                                  │
│ [All ▼] [Search...]                     │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ The Grand Ballroom                   │ │
│ │ ✓ Approved                           │ │
│ │ 5 offerings • 3 active events        │ │
│ │ COI expires: 12/31/2025              │ │
│ │                          [Manage]    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Riverside Events                     │ │
│ │ ✓ Approved                           │ │
│ │ 3 offerings • 1 active event         │ │
│ │ COI expires: 06/30/2026              │ │
│ │                          [Manage]    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Harbor View Hall                     │ │
│ │ ⏳ Pending Approval                  │ │
│ │ 2 offerings submitted                │ │
│ │ COI uploaded                         │ │
│ │                          [View]      │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**Venue Card Shows:**
- Venue name
- Approval status
- Number of offerings
- Number of active events
- COI expiration date
- Manage button

---

## Individual Venue Page

**Purpose:** Manage offerings and COI for specific venue

**Layout:**
```
┌─────────────────────────────────────────┐
│ [← Venues]  The Grand Ballroom          │
├─────────────────────────────────────────┤
│                                         │
│ Approval Status: ✓ Approved             │
│ Active Events: 3                        │
│                                         │
│ Certificate of Insurance                │
│ ─────────────────────                   │
│ Current COI expires: 12/31/2025         │
│ Coverage: $2,000,000                    │
│ 📄 COI_Current.pdf                      │
│ [Upload New COI]                        │
│                                         │
│ Your Offerings                          │
│ ─────────────────────  [+ Add Offering] │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [Image] Buffet Dinner Service        │ │
│ │         $45/person                   │ │
│ │         Lead time: 14 days           │ │
│ │                          [Edit]      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [Image] Plated Dinner Service        │ │
│ │         $65/person                   │ │
│ │         Lead time: 21 days           │ │
│ │                          [Edit]      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [Image] Cocktail Hour Package        │ │
│ │         $25/person                   │ │
│ │         Lead time: 10 days           │ │
│ │                          [Edit]      │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

### Manage Offerings

**Add/Edit Offering:**
```
┌─────────────────────────────────────────┐
│ Edit Offering: Buffet Dinner Service    │
│ For: The Grand Ballroom                 │
├─────────────────────────────────────────┤
│                                         │
│ Service Name:                           │
│ [____________]                          │
│                                         │
│ Category:                               │
│ [Catering ▼]                            │
│                                         │
│ Pricing:                                │
│ $[____] per [person ▼]                  │
│                                         │
│ Description:                            │
│ [________________________]              │
│ [________________________]              │
│ [________________________]              │
│                                         │
│ Photos:                                 │
│ [Image 1] [Image 2] [Image 3]           │
│ [+ Upload Photos]                       │
│                                         │
│ Menu/Sample Files:                      │
│ 📄 Sample_Menu.pdf                      │
│ 📄 Dietary_Options.pdf                  │
│ [+ Upload Files]                        │
│                                         │
│ Lead Time Required:                     │
│ [__] days advance notice                │
│                                         │
│ Seasonal Pricing: (optional)            │
│ Peak season (Jun-Sep): +15%             │
│ [+ Add Seasonal Rule]                   │
│                                         │
│ [Delete] [Cancel] [Save Changes]        │
└─────────────────────────────────────────┘
```

**Features:**
- Venue-specific pricing
- Different lead times per venue
- Upload photos and sample files
- Seasonal pricing rules
- Minimum/maximum guest counts
- Blackout dates

### Upload COI

```
┌─────────────────────────────────────────┐
│ Update Certificate of Insurance         │
│ For: The Grand Ballroom                 │
├─────────────────────────────────────────┤
│                                         │
│ Upload New COI:                         │
│ [Choose File] or [Drag & Drop]          │
│                                         │
│ Insurance Company:                      │
│ [____________]                          │
│                                         │
│ Policy Number:                          │
│ [____________]                          │
│                                         │
│ Expiration Date:                        │
│ [__/__/____]                            │
│                                         │
│ Coverage Amount:                        │
│ $[____________]                         │
│                                         │
│ Additional Insured:                     │
│ ☑ The Grand Ballroom is listed as      │
│   additional insured                    │
│                                         │
│ [Cancel] [Submit for Approval]          │
└─────────────────────────────────────────┘
```

---

## Notifications

**Types of Notifications:**
- New event assignment
- Message from venue
- Request for information/action
- Deadline approaching
- Payment received
- COI expiring soon

**Notification Delivery:**
- In-app badge on relevant pages
- Email for urgent items
- SMS for same-day/critical (optional, user preference)

---

## Design Guidelines

### Simplified Interface
- Vendors don't need as many features as venues
- Focus on clarity and task completion
- Mobile-friendly (many vendors work on-site)

### Clear Information Hierarchy
- What needs action first
- Clear deadlines
- Easy access to specifications

### Efficient Communication
- Quick responses to venues
- File sharing capabilities
- Thread continuity

### Responsive Design
- Mobile-first (vendors often on-the-go)
- Tablet support
- Desktop for detailed work

### Accessibility
- WCAG 2.1 AA compliance
- Clear, readable text
- High contrast
- Touch-friendly targets (mobile)

---

## Key Differences from Client/Venue Views

**What Vendors DON'T Have:**
- ❌ AI chatbot assistant
- ❌ Full event visibility
- ❌ Access to other vendors' information
- ❌ Client personal data
- ❌ Event budget details
- ❌ Guest lists

**What Vendors DO Have:**
- ✅ Clear service specifications
- ✅ Communication with venue AI
- ✅ Multiple venue management
- ✅ Offerings management per venue
- ✅ Calendar and deadline tracking
- ✅ COI management

---

## Future Enhancements

**v1.1+:**
- Vendor profile/portfolio page
- Direct client communication (with venue permission)
- Review system
- Payment tracking
- Team member access
- Inventory management
- Resource scheduling
- Multi-language support
- Analytics (booking trends, revenue)
- Marketplace listing (for new venue discovery)