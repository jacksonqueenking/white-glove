# Onboarding Flows

## Overview

This document describes how different user types join and begin using the platform.

---

## Client Onboarding (v1.0)

### Entry Point: Venue Website

**Initial Implementation:** Clients discover the platform through individual venue websites. Each venue has an embedded booking form or a hosted booking page.

### Step-by-Step Flow

#### 1. Discovery
- Client browses venue's website
- Finds booking/inquiry form
- Clicks "Check Availability" or "Book Event"

#### 2. Inquiry Form

**Form Fields:**
- **Required:**
  - Full Name
  - Email
  - Phone Number
  - Event Date
  - Event Time
  - Space Selection (if venue has multiple spaces)
  - Estimated Guest Count
  - Budget Range
  - Event Description/Notes

- **Optional (Configurable by Venue):**
  - Company Name (for corporate events)
  - Event Type (Wedding, Corporate, Birthday, etc.)
  - Preferred Contact Method

**Form Validation:**
```typescript
const InquiryFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().regex(/^[0-9-()+\s]+$/, "Valid phone required"),
  event_date: z.date().min(new Date(), "Date must be in future"),
  event_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  space_ids: z.array(z.string().uuid()).min(1),
  guest_count: z.number().min(1).max(10000),
  budget: z.number().min(0),
  description: z.string().min(10, "Please provide some details"),
  company: z.string().optional()
});
```

#### 3. Availability Check

**Backend Process:**
```typescript
async function checkAvailability(date: Date, spaceIds: string[]) {
  // Check if any selected spaces are already booked
  const conflicts = await db.events
    .where('date', date)
    .whereIn('space_id', spaceIds)
    .where('status', 'not in', ['cancelled', 'inquiry']);
  
  if (conflicts.length > 0) {
    return {
      available: false,
      conflictingSpaces: conflicts.map(e => e.space_id),
      alternativeDates: await suggestAlternativeDates(date, spaceIds)
    };
  }
  
  return { available: true };
}
```

**If Unavailable:**
```
┌─────────────────────────────────────────┐
│ ⚠️  Sorry, [Space Name] is not          │
│     available on [Date]                 │
│                                         │
│  Would you like to see alternative      │
│  dates?                                 │
│                                         │
│  [View Alternatives] [Pick New Date]    │
└─────────────────────────────────────────┘
```

**If Available:**
Form submits and continues to next step.

#### 4. Event Creation & AI Element Suggestion

**Backend Process:**
```typescript
async function processInquiry(formData: InquiryForm) {
  // 1. Create event record
  const event = await db.events.create({
    status: 'inquiry',
    client_id: null, // Will be set after client confirms
    venue_id: formData.venue_id,
    date: formData.event_date,
    // ... other fields
  });
  
  // 2. Invoke AI to suggest elements
  const suggestedElements = await orchestrator.suggestElements({
    event_id: event.id,
    guest_count: formData.guest_count,
    budget: formData.budget,
    description: formData.description,
    available_elements: await getVenueElements(formData.venue_id)
  });
  
  // 3. Add suggested elements to event
  for (const element of suggestedElements) {
    await db.event_elements.create({
      event_id: event.id,
      element_id: element.id,
      status: 'proposed',
      // ... other fields
    });
  }
  
  // 4. Create task for venue
  await orchestrator.createTask({
    event_id: event.id,
    assigned_to: formData.venue_id,
    assigned_to_type: 'venue',
    name: `Review booking request: ${formData.name} - ${formData.event_date}`,
    description: `New event inquiry from ${formData.name} for ${formData.guest_count} guests`,
    priority: 'high',
    status: 'pending'
  });
  
  // 5. Send notification to venue
  await notificationService.send({
    to: formData.venue_id,
    type: 'new_inquiry',
    channel: ['in_app', 'email'],
    data: event
  });
  
  return event;
}
```

**Client Sees:**
```
┌─────────────────────────────────────────┐
│ ✓ Request Received!                     │
│                                         │
│  Thank you for your interest in         │
│  [Venue Name]!                          │
│                                         │
│  We've received your request for        │
│  [Date] and will review it shortly.     │
│                                         │
│  You'll receive an email within 24      │
│  hours with next steps.                 │
│                                         │
│  Reference #: [EVENT-12345]             │
└─────────────────────────────────────────┘
```

#### 5. Venue Reviews & Approves

**Venue Dashboard:**
- Task appears: "Review booking request"
- Venue clicks task → Opens event details
- Reviews:
  - Client information
  - Date/time/space requested
  - Guest count
  - Budget
  - Description
  - AI-suggested elements

**Venue Actions:**
- **Accept Booking:**
  - Optionally adjust suggested elements
  - Add notes for client
  - Click "Accept & Send Confirmation"
  
- **Decline Booking:**
  - Select reason
  - Optionally suggest alternative dates
  - Click "Decline Request"

#### 6. Confirmation Email Sent

**If Venue Accepts:**

```
From: [Venue Name] via EventPlatform
To: [Client Email]
Subject: Your booking at [Venue Name] is confirmed! 🎉

Hi [Client Name],

Great news! [Venue Name] has confirmed your booking for:

Date: [Date]
Time: [Time]
Space: [Space Name]
Guests: [Count]

To secure your booking, please confirm within 24 hours:
[Confirm Booking Button]

After confirming, you'll be able to:
- Chat with your AI event assistant
- Customize your event details
- Manage your guest list
- Review and approve vendors
- Track your budget

Looking forward to hosting your event!

[Venue Name] Team
```

#### 7. Client Confirmation

**Client Clicks Link:**
- Taken to account creation page
- Pre-filled with information from inquiry form

**Account Creation:**
```
┌─────────────────────────────────────────┐
│  Confirm Your Booking                   │
│                                         │
│  Email: [Pre-filled]                    │
│  Password: [________]                   │
│  Confirm Password: [________]           │
│                                         │
│  ☑ I agree to Terms of Service          │
│                                         │
│  [Create Account & Confirm Booking]     │
│                                         │
│  Or use magic link:                     │
│  [Send Magic Link to Email]             │
└─────────────────────────────────────────┘
```

**After Confirmation:**
- Account created
- Event status → "confirmed"
- Client automatically logged in
- Redirected to Event Page
- Welcome message in chat from AI assistant

#### 8. 24-Hour Warning (If Not Confirmed)

**System automatically sends at 24-hour mark:**

```
From: [Venue Name] via EventPlatform
To: [Client Email]
Subject: ⏰ Action Required: Confirm your booking

Hi [Client Name],

Your booking for [Date] at [Venue Name] is awaiting confirmation.

Please confirm within the next few hours to secure your date. 
If we don't hear from you soon, this date may be offered to 
another client.

[Confirm Booking Now]

Questions? Reply to this email.

[Venue Name] Team
```

---

## Venue Onboarding (v1.0)

### Entry Point: Invitation Only

**Initial Phase:** Platform team manually invites venues during beta/launch.

### Step-by-Step Flow

#### 1. Invitation Email

```
From: EventPlatform Team
To: [Venue Contact]
Subject: You're invited to join EventPlatform! 🎉

Hi [Venue Name],

We're excited to invite you to join EventPlatform - the AI-powered 
event management platform that's transforming how venues work with 
clients.

With EventPlatform, you'll:
- Automate booking inquiries and coordination
- Reduce back-and-forth emails by 80%
- Get an AI assistant to help manage events
- Connect with vetted vendors
- Track everything in one place

Ready to get started?
[Accept Invitation]

This invitation expires in 7 days.

Questions? Schedule a demo: [Calendar Link]

The EventPlatform Team
```

#### 2. Account Setup

**Page 1: Basic Information**
```
┌─────────────────────────────────────────┐
│  Welcome to EventPlatform!              │
│                                         │
│  Venue Name: [____________]             │
│  Contact Name: [____________]           │
│  Email: [____________]                  │
│  Phone: [____________]                  │
│  Password: [____________]               │
│                                         │
│  [Continue →]                           │
└─────────────────────────────────────────┘
```

**Page 2: Location & Details**
```
┌─────────────────────────────────────────┐
│  Tell us about your venue               │
│                                         │
│  Address:                               │
│  Street: [____________]                 │
│  City: [____________]                   │
│  State: [__]  ZIP: [_____]              │
│                                         │
│  Description:                           │
│  [________________________]             │
│  [________________________]             │
│  [________________________]             │
│                                         │
│  [← Back] [Continue →]                  │
└─────────────────────────────────────────┘
```

#### 3. Create Spaces (Required)

```
┌─────────────────────────────────────────┐
│  Add Your Event Spaces                  │
│  (Add at least one)                     │
│                                         │
│  Space Name: [____________]             │
│  Description: [____________]            │
│  Capacity: [____] guests                │
│  Main Image: [Upload]                   │
│  Additional Photos: [Upload]  (optional)│
│  Floor Plan: [Upload]  (optional)       │
│                                         │
│  [+ Add Another Space]                  │
│                                         │
│  Spaces Added: (1)                      │
│  ● Main Ballroom                        │
│                                         │
│  [← Back] [Continue →]                  │
└─────────────────────────────────────────┘
```

#### 4. Create Offerings (Required)

```
┌─────────────────────────────────────────┐
│  Add Your Services & Offerings          │
│  (Add at least 3-5)                     │
│                                         │
│  What do you provide in-house?          │
│                                         │
│  Offering Name: [____________]          │
│  Category: [Select ▼]                   │
│  Price: $[____]                         │
│  Description: [____________]            │
│  Image: [Upload]  (optional)            │
│                                         │
│  Lead Time: [__] days notice required   │
│                                         │
│  [+ Add Another Offering]               │
│                                         │
│  Offerings Added: (3)                   │
│  ● Venue Rental                         │
│  ● Tables & Chairs                      │
│  ● Basic AV Setup                       │
│                                         │
│  [← Back] [Continue →]                  │
└─────────────────────────────────────────┘
```

**Suggested Categories:**
- Venue Rental
- Tables & Chairs
- Linens & Décor
- Audio/Visual Equipment
- Catering (in-house)
- Bar Service
- Coordination Services
- Setup/Cleanup
- Parking
- Other

#### 5. Review & Submit

```
┌─────────────────────────────────────────┐
│  Review Your Information                │
│                                         │
│  ✓ Basic Information                    │
│  ✓ Location & Description               │
│  ✓ Spaces (1 added)                     │
│  ✓ Offerings (3 added)                  │
│                                         │
│  Your profile will be reviewed by our   │
│  team and approved within 1-2 business  │
│  days.                                  │
│                                         │
│  [← Back] [Submit for Approval]         │
└─────────────────────────────────────────┘
```

#### 6. Platform Review

**Admin Dashboard:**
- New venue appears in "Pending Approval" queue
- Admin reviews:
  - Venue information completeness
  - Space details and photos
  - Offering descriptions and pricing
  - Any red flags

**Admin Actions:**
- **Approve:** Venue goes live
- **Request Changes:** Email sent with specific items to fix
- **Reject:** (Rare) Venue notified with reason

#### 7. Approval Notification

**Email to Venue:**
```
From: EventPlatform Team
To: [Venue Email]
Subject: 🎉 You're approved! Your venue is now live

Hi [Venue Name],

Congratulations! Your venue profile has been approved and 
is now live on EventPlatform.

Your booking page: [venue-slug].eventplatform.com

Next Steps:
1. Share your booking page on your website
2. Invite your preferred vendors
3. Customize your booking form (optional)
4. Start accepting bookings!

Need help getting started?
- Watch: Quick Start Video
- Read: Venue Guide
- Schedule: Onboarding Call

Welcome to EventPlatform!

The EventPlatform Team
```

**Venue Logs In:**
- Sees dashboard with onboarding checklist
- Can immediately start accepting bookings
- Can continue adding spaces, offerings, vendors

---

## Vendor Onboarding (v1.0)

### Entry Point: Venue Invitation

Venues invite their preferred vendors to join the platform.

### Step-by-Step Flow

#### 1. Venue Sends Invitation

**Venue Dashboard → Vendors Page:**
```
┌─────────────────────────────────────────┐
│  Invite a Vendor                        │
│                                         │
│  Vendor Name: [____________]            │
│  Email: [____________]                  │
│  Phone: [____________]                  │
│  Services: [Select ▼]  (Photography,    │
│            Catering, Flowers, etc.)     │
│                                         │
│  Personal Note (optional):              │
│  [________________________]             │
│                                         │
│  [Cancel] [Send Invitation]             │
└─────────────────────────────────────────┘
```

#### 2. Vendor Receives Invitation

```
From: [Venue Name] via EventPlatform
To: [Vendor Email]
Subject: [Venue Name] invites you to join EventPlatform

Hi [Vendor Name],

[Venue Name] has invited you to join them on EventPlatform!

EventPlatform helps vendors like you streamline coordination 
with venues and clients:

- Get clear, detailed orders automatically
- Chat with venues through AI assistants
- Manage multiple venue relationships in one place
- Track deadlines and deliverables
- Get paid faster

[Venue Name] says: "[Personal Note if provided]"

Ready to join?
[Accept Invitation]

This invitation expires in 14 days.

Questions? Reply to this email or visit our FAQ.

The EventPlatform Team
```

#### 3. Vendor Account Setup

**Page 1: Basic Information**
```
┌─────────────────────────────────────────┐
│  Join EventPlatform                     │
│  Invited by: [Venue Name]               │
│                                         │
│  Business Name: [Pre-filled]            │
│  Contact Name: [____________]           │
│  Email: [Pre-filled]                    │
│  Phone: [Pre-filled]                    │
│  Password: [____________]               │
│                                         │
│  Address:                               │
│  Street: [____________]                 │
│  City: [____________]                   │
│  State: [__]  ZIP: [_____]              │
│                                         │
│  About Your Business:                   │
│  [________________________]             │
│  [________________________]             │
│                                         │
│  [Create Account]                       │
│                                         │
│  Or use magic link:                     │
│  [Send Magic Link]                      │
└─────────────────────────────────────────┘
```

#### 4. Vendor Logs In

**First Login Experience:**
```
┌─────────────────────────────────────────┐
│  Welcome to EventPlatform!              │
│                                         │
│  You're connected with:                 │
│  ● [Venue Name]                         │
│                                         │
│  Next steps:                            │
│  ☐ Add your services for [Venue Name]  │
│  ☐ Upload Certificate of Insurance      │
│  ☐ Set your pricing                     │
│                                         │
│  [Get Started]                          │
└─────────────────────────────────────────┘
```

#### 5. Add Offerings for Venue

**Venues Page → Click Venue → Add Offerings:**
```
┌─────────────────────────────────────────┐
│  Your Services at [Venue Name]          │
│                                         │
│  Service Name: [____________]           │
│  Category: [Select ▼]                   │
│  Base Price: $[____]                    │
│  Description: [____________]            │
│  Photos: [Upload]  (optional)           │
│  Sample Files: [Upload]  (menus, etc.)  │
│                                         │
│  Lead Time: [__] days notice required   │
│                                         │
│  [+ Add Another Service]                │
│  [Save]                                 │
└─────────────────────────────────────────┘
```

#### 6. Upload COI

```
┌─────────────────────────────────────────┐
│  Certificate of Insurance               │
│  Required by [Venue Name]               │
│                                         │
│  Upload COI: [Choose File]              │
│                                         │
│  Insurance Company: [____________]      │
│  Policy Number: [____________]          │
│  Expiration Date: [__/__/____]          │
│  Coverage Amount: $[____________]       │
│                                         │
│  [Cancel] [Submit for Approval]         │
└─────────────────────────────────────────┘
```

#### 7. Venue Approves

**Venue Reviews:**
- Vendor's services
- Pricing
- COI documentation

**Venue Approves:**
- Vendor becomes "Approved" for this venue
- Vendor's offerings become available for events at this venue
- Vendor can now receive orders

#### 8. Ready to Work

**Vendor Dashboard:**
- Can see events they're assigned to
- Receives messages from venue AI
- Can manage offerings
- Can track orders and deadlines

---

## Future Enhanarding Flows (v2.0+)

### Client - Direct Platform Registration
- Clients can register directly on platform
- Browse multiple venues
- Compare pricing
- Multi-venue inquiry

### Venue - Public Application
- Open application process
- Automated screening
- Tiered membership levels

### Vendor - Direct Registration
- Vendors can register independently
- Create vendor profile
- Request approval from multiple venues
- Marketplace listing