# Payment Processing Documentation

## Overview

The platform uses Stripe for all payment processing. Payments are straightforward: clients pay for their events, funds are held by the platform, and venues receive payouts after events. This document describes the payment concepts, user flows, and requirements.

---

## Payment Architecture

### Payment Flow

```
Client → Stripe Checkout → Platform
                              ↓
                          (holds funds)
                              ↓
                            Venue
                              ↓
                    (pays vendors separately)
```

**v1.0 Scope:**
- Clients pay via Stripe
- Platform holds funds and takes fees
- Venues paid via Stripe Connect
- Vendors paid by venues outside platform

**Future:**
- Direct vendor payments through platform
- Split payments to multiple parties
- Escrow services

---

## Payment Concepts

### Events Have Multiple Payable Items

Each event has elements (venue rental, catering, photography, etc.). Each element may have:
- Base price
- Payment schedule (deposit, installments, final payment)
- Different due dates
- Different vendors

**Example Event Breakdown:**
- Venue rental: $2,500 (due 60 days before)
- Catering: $8,000 (50% deposit 30 days before, rest 7 days before)
- Photography: $2,000 (full payment 14 days before)

### Deposit Rules

Venues and vendors can configure deposit requirements:
- **Deposit percentage** (e.g., 50%)
- **When deposit is due** (e.g., 60 days before event)
- **Minimum deposit amount** (e.g., at least $500)
- **Installment options** (allow splitting payments)

**System automatically calculates payment schedules based on these rules.**

---

## User Flows

### Client Payment Flow

1. **Review Contract/Billing Page**
   - Sees all elements with pricing
   - Sees payment schedule for each item
   - Sees what's paid vs. outstanding
   - Total amounts clearly displayed

2. **Click "Pay Now" Button**
   - Can pay for one or multiple items
   - Redirected to Stripe Checkout

3. **Stripe Checkout (Hosted by Stripe)**
   - Enter payment information
   - PCI-compliant, secure
   - Stripe handles all card data
   - Platform never sees card numbers

4. **After Payment**
   - Redirected back to platform
   - Success message displayed
   - Payment status updated in real-time
   - Confirmation email sent
   - Receipt emailed

5. **View Payment History**
   - All past payments listed
   - Download receipts
   - See upcoming payment deadlines

### Venue Payment Flow (Receiving Money)

1. **Venue Onboarding to Stripe**
   - During setup, venue connects Stripe account
   - Uses Stripe Connect Express or Standard
   - One-time setup process
   - Stripe verifies bank account

2. **Receiving Payments**
   - Automatic after event completion
   - Platform fee deducted (e.g., 10%)
   - Funds transferred to venue's bank
   - Payout typically 2-7 days

3. **View Payouts**
   - Dashboard shows payment status
   - Upcoming payouts
   - Payment history
   - Can export for accounting

---

## Contract & Billing Interface

### Client View

**Contract/Billing Page shows:**
- **Element breakdown:** Each service/item listed separately
- **For each element:**
  - Name and description
  - Total price
  - Payment schedule (deposit, installments, final)
  - Due dates
  - Status (unpaid, deposit paid, fully paid)
  - "Pay Now" button if payment due
- **Summary section:**
  - Total paid to date
  - Outstanding balance
  - Grand total
- **Actions:**
  - Download contract as PDF
  - View payment history
  - Payment links for each due amount

**Payment status indicators:**
- ⚫ Unpaid (red)
- 🟡 Deposit paid (yellow)
- 🟢 Fully paid (green)

### Venue View

**Same element breakdown plus:**
- Mark payments as received (for offline payments)
- Generate/send invoices
- Send payment reminders
- Configure deposit rules
- Track payment status across all events

---

## Payment Schedules

### How Schedules Work

When an element is added to an event:
1. System checks deposit rules for that venue/vendor
2. Calculates payment schedule automatically
3. Sets due dates based on event date
4. Creates payment tasks/reminders

**Example Calculation:**
- Element: Catering, $6,000
- Rule: 50% deposit, 30 days before event
- Event date: October 15
- Result:
  - Deposit: $3,000 due by September 15
  - Final: $3,000 due by October 8

### Payment Reminders

**Automatic reminders sent:**
- 7 days before due date (email)
- 3 days before due date (email + in-app)
- 1 day before due date (email + in-app)
- Day of due date (email + in-app, marked urgent)
- After due date (daily reminders, escalation)

---

## Stripe Integration Points

### Stripe Checkout Sessions

**What it is:** Stripe's hosted payment page

**Why use it:**
- PCI compliant (we don't handle card data)
- Mobile-optimized
- Multiple payment methods
- Built-in validation
- Localization support
- Proven conversion rates

**How it works:**
1. Platform creates checkout session via Stripe API
2. User redirected to Stripe's page
3. User enters payment info
4. Stripe processes payment
5. User redirected back to platform
6. Webhook confirms payment

### Stripe Connect (for Venues)

**What it is:** Stripe's solution for marketplaces/platforms

**Why use it:**
- Handles payouts to venues
- Platform can take fees automatically
- Venues manage their own Stripe account
- Compliance handled by Stripe
- Tax reporting handled

**Account types:**
- **Express:** Fastest setup, Stripe handles most compliance
- **Standard:** Venue has full Stripe dashboard access

### Webhooks

**What they are:** Stripe notifies platform when events occur

**Key events to handle:**
- Payment succeeded
- Payment failed
- Refund processed
- Payout completed
- Account updated

**Why important:** Keeps platform data in sync with Stripe's records

---

## Invoices

### Invoice Generation

**Automatically generated when:**
- Event elements are finalized
- Client requests invoice
- Payment is due

**Invoice includes:**
- Venue information
- Client information
- Event details
- Itemized element list with pricing
- Payment terms
- Due dates
- Total amount
- Payment status

**Formats:**
- PDF (downloadable)
- HTML (viewable in browser)
- Email-friendly version

### Invoice Management

**Venues can:**
- Generate invoices on demand
- Send invoices to clients
- Mark invoices as paid
- Track invoice status
- Export for accounting

---

## Refunds

### Refund Policy

**Default policy (customizable per venue):**
- 30+ days before: Full refund
- 15-30 days before: 50% refund
- Less than 15 days: No refund

**Special cases:**
- Venue cancels: Full refund always
- Weather/emergency: Venue's discretion
- Rescheduling: No refund, applies to new date

### Refund Process

1. **Refund requested** (by client or venue)
2. **System checks policy** for refund amount
3. **Venue approves** (or system approves if automatic)
4. **Refund processed** via Stripe
5. **Both parties notified**
6. **5-10 days** for funds to appear in client's account

**Partial refunds supported** for individual elements.

---

## Failed Payments

### When Payments Fail

**Common reasons:**
- Insufficient funds
- Card expired
- Card declined by bank
- Payment method issue

**What happens:**
1. Client sees error message
2. Client can retry immediately
3. Venue notified of failure
4. Task created for venue to follow up
5. Automated retry after 3 days (optional)
6. If still failing, venue contacts client directly

### Preventing Payment Issues

**Best practices:**
- Send reminders well in advance
- Allow multiple payment methods
- Clear error messages
- Easy retry process
- Venue can mark as "paid offline" if needed

---

## Security & Compliance

### PCI Compliance

**Critical rule: Platform never stores card data.**

**How this works:**
- Stripe Checkout handles all card input
- Card data goes directly to Stripe
- Platform only stores Stripe IDs (safe tokens)
- No card numbers, CVVs, etc. ever in our database

**Stripe is PCI DSS Level 1 certified** - highest security standard.

### Data Protection

**What we store:**
- Stripe customer IDs (safe)
- Stripe payment intent IDs (safe)
- Payment amounts and dates
- Payment status

**What we never store:**
- Card numbers
- CVV codes
- Full card data

### Fraud Prevention

**Stripe handles:**
- Fraud detection
- 3D Secure authentication
- Velocity checks
- Machine learning fraud models

**Platform handles:**
- User authentication
- Rate limiting
- Audit logging
- Unusual activity monitoring

---

## Payment Tracking & Reporting

### For Clients

**Payment dashboard shows:**
- Upcoming payments with due dates
- Payment history with receipts
- Total spent
- Outstanding balance
- Download statements

### For Venues

**Financial dashboard shows:**
- Revenue by event
- Pending payouts
- Payment history
- Commission/fee breakdown
- Outstanding payments from clients
- Export data for accounting

### For Platform

**Analytics track:**
- Total transaction volume
- Average payment size
- Payment success rates
- Failed payment reasons
- Refund rates
- Revenue (fees collected)

---

## Special Cases

### Offline Payments

Sometimes clients pay outside the platform (check, wire transfer, etc.).

**Process:**
1. Client pays venue directly
2. Venue marks payment as "received offline" in system
3. System updates payment status
4. No Stripe transaction, no platform fee
5. Recorded for tracking purposes

### Payment Plans

**Future feature:** Allow clients to split payments into installments.

**Concept:**
- Client selects "payment plan" option
- System calculates equal installments
- Automatic charges on schedule
- Interest optional (configurable)

### Multi-Currency

**Future feature:** Support international payments.

**v1.0:** USD only
**Future:** Detect client location, offer local currency

---

## Testing

### Test Mode

**Development uses Stripe test mode:**
- All API keys prefixed with `test_`
- No real money involved
- Simulate any scenario

**Test cards available:**
- Success: 4242 4242 4242 4242
- Declined: 4000 0000 0000 0002
- Requires authentication: 4000 0025 0000 3155
- Insufficient funds: 4000 0000 0000 9995

### Testing Scenarios

**Should test:**
- Successful payment flow
- Failed payment handling
- Refund processing
- Webhook delivery
- Payout schedules
- Multiple payment methods
- Edge cases (expired cards, etc.)

---

## User Experience Principles

### For Clients

**Make it easy:**
- Clear pricing always visible
- No surprise fees
- Flexible payment options
- Save payment methods (via Stripe)
- Mobile-friendly checkout
- Clear confirmation and receipts

**Build trust:**
- Secure payment indicators
- Clear refund policy
- Transparent pricing
- Professional invoices
- Responsive support for payment issues

### For Venues

**Make it simple:**
- Easy Stripe onboarding
- Automatic payouts
- Clear reporting
- Minimal manual work
- Handle edge cases gracefully

**Provide control:**
- Set deposit rules
- Configure payment schedules
- Manage refund approvals
- Track all transactions
- Export for accounting

---

## Future Enhancements

**v1.1+:**
- Split payments (pay multiple vendors directly)
- Payment plans with installments
- Tip/gratuity handling
- Payment reminders via SMS

---

## Key Principles

1. **Use Stripe for everything payment-related** - Don't reinvent the wheel
2. **Never store card data** - PCI compliance is critical
3. **Keep it simple for users** - Clear pricing, easy checkout
4. **Automate where possible** - Reminders, schedules, payouts
5. **Provide transparency** - Show all costs, no hidden fees
6. **Handle failures gracefully** - Clear errors, easy retry