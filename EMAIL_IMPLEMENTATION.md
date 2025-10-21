# Email Implementation with Resend

## Overview

The inquiry flow now sends beautiful HTML emails at key points in the workflow using Resend.

## Setup

### 1. Environment Variables

Add these to your `.env.local` (already set in Vercel):

```bash
RESEND_API_KEY=re_your_key_here
RESEND_FROM_EMAIL=onboarding@yourdomain.com  # or use onboarding@resend.dev for testing
NEXT_PUBLIC_URL=https://yourdomain.com  # or http://localhost:3000 for local
```

### 2. Package Installed

```bash
npm install resend
```

## Email Templates

### 1. Venue Notification Email (`sendNewInquiryNotification`)

**Sent when**: Client submits an inquiry form
**To**: Venue email
**Subject**: "🔔 New booking inquiry from [Client Name]"

**Includes**:
- Client name
- Event date and time
- Guest count
- Reference number
- Link to review in tasks dashboard

### 2. Approval Email (`sendInquiryApprovalEmail`)

**Sent when**: Venue approves an inquiry
**To**: Client email
**Subject**: "Your booking at [Venue Name] is confirmed! 🎉"

**Includes**:
- Confirmation that booking is approved
- Event details (date, time, spaces, guest count)
- Venue notes (if any)
- Call-to-action button to create account
- 48-hour expiry warning
- List of what they can do after confirming

### 3. Decline Email (`sendInquiryDeclineEmail`)

**Sent when**: Venue declines an inquiry
**To**: Client email
**Subject**: "Update on your booking request at [Venue Name]"

**Includes**:
- Decline reason from venue
- Alternative dates (if venue suggested any)
- Encouragement to contact venue for other options

## Email Design

All emails feature:
- ✅ Responsive HTML design
- ✅ Beautiful gradients and colors
- ✅ Mobile-friendly layout
- ✅ Branded appearance
- ✅ Clear call-to-action buttons
- ✅ Professional styling

## Implementation Files

### Core Email Module
**File**: `lib/email/resend.ts`

Contains:
- `sendEmail()` - Base email sending function
- `sendNewInquiryNotification()` - Venue notification
- `sendInquiryApprovalEmail()` - Client approval email
- `sendInquiryDeclineEmail()` - Client decline email

### Integration Points

1. **Inquiry Submission** ([app/api/inquiries/route.ts](app/api/inquiries/route.ts))
   ```typescript
   await sendNewInquiryNotification({
     venueName,
     venueEmail,
     clientName,
     eventDate,
     eventTime,
     guestCount,
     referenceNumber,
   });
   ```

2. **Approval** ([app/api/inquiries/[inquiryId]/approve/route.ts](app/api/inquiries/[inquiryId]/approve/route.ts))
   ```typescript
   await sendInquiryApprovalEmail({
     clientName,
     clientEmail,
     venueName,
     eventDate,
     eventTime,
     spaceNames,
     guestCount,
     venueNotes,
     confirmationToken,
   });
   ```

3. **Decline** (same file)
   ```typescript
   await sendInquiryDeclineEmail({
     clientName,
     clientEmail,
     venueName,
     eventDate,
     declineReason,
     alternativeDates,
   });
   ```

## Error Handling

All email sending is wrapped in try-catch blocks:
- Logs errors to console
- **Does not fail the request** if email fails
- Allows the flow to continue even if email service is down

```typescript
try {
  await sendInquiryApprovalEmail({...});
} catch (emailError) {
  console.error('Error sending approval email:', emailError);
  // Don't fail the request if email fails
}
```

## Testing Emails

### Local Development

1. Set `RESEND_FROM_EMAIL=onboarding@resend.dev` for testing
2. Emails will be sent to the test inbox
3. Check Resend dashboard for sent emails

### Production

1. Verify your domain in Resend
2. Update `RESEND_FROM_EMAIL` to use your verified domain
3. Set in Vercel environment variables

## Email Flow Diagram

```
Client Submits Inquiry
    ↓
📧 Venue gets "New Inquiry" email → Venue reviews in dashboard
    ↓
Venue Approves
    ↓
📧 Client gets "Booking Confirmed" email with account creation link
    ↓
Client creates account → Booking complete!

OR

Venue Declines
    ↓
📧 Client gets "Request Declined" email with reason + alternatives
```

## Customization

To customize email templates, edit the HTML in `lib/email/resend.ts`. The templates use:
- Inline CSS for maximum compatibility
- Table-based layouts for email client support
- Gradient backgrounds for visual appeal
- Responsive design with mobile breakpoints

## Future Enhancements

- [ ] Add email preview/test endpoints
- [ ] Create reminder emails (24 hours before expiry)
- [ ] Add email templates for other flows (vendor invites, etc.)
- [ ] Support for email attachments (contracts, etc.)
- [ ] Email analytics tracking (opens, clicks)
- [ ] Scheduled email sending
- [ ] Email templates in admin dashboard for venue customization

## Troubleshooting

### Email not sending

1. Check `RESEND_API_KEY` is set correctly
2. Verify `RESEND_FROM_EMAIL` is either `onboarding@resend.dev` (testing) or a verified domain
3. Check Resend dashboard for errors
4. Look at server logs for error messages

### Email going to spam

1. Verify your domain in Resend
2. Set up SPF, DKIM, and DMARC records
3. Use a proper from address (not `noreply@`)
4. Ensure content doesn't trigger spam filters

### Styling issues

1. Email clients have limited CSS support
2. Always use inline styles
3. Use tables for layout (not flexbox/grid)
4. Test in multiple email clients (Gmail, Outlook, Apple Mail)

## Support

For Resend-specific issues, check:
- [Resend Documentation](https://resend.com/docs)
- [Resend Dashboard](https://resend.com/dashboard)
- [Email sending limits](https://resend.com/docs/dashboard/account/limits)
