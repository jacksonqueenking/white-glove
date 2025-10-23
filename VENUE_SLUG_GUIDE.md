# Venue Slug System Guide

## Overview

The booking page supports both **slugs** (human-readable) and **venue IDs** (UUIDs) for maximum flexibility.

## URL Formats

### With Slug (Recommended)
```
https://yourdomain.com/book/golden-gardens-ballroom
https://yourdomain.com/book/the-grand-estate
https://yourdomain.com/book/riverside-venue-sf
```

### With Venue ID (Backwards Compatible)
```
https://yourdomain.com/book/123e4567-e89b-12d3-a456-426614174000
```

## How Venues Get Their Booking Link

### Option 1: Booking Link Component (Recommended)

Add the `BookingLinkCard` component to the venue dashboard:

```tsx
// app/venue/page.tsx or app/venue/profile/page.tsx
import { BookingLinkCard } from '@/components/venue/BookingLinkCard';

export default function VenueDashboard() {
  return (
    <div>
      {/* Other dashboard content */}
      <BookingLinkCard />
    </div>
  );
}
```

This component:
- ✅ Automatically fetches the venue's booking URL
- ✅ Uses slug if available, falls back to venue_id
- ✅ One-click copy to clipboard
- ✅ Shows helpful usage tips
- ✅ Beautiful design matching your theme

### Option 2: API Endpoint

Venues can call the API directly:

```bash
GET /api/venue/booking-link
Authorization: Bearer <user-token>
```

Response:
```json
{
  "bookingUrl": "https://yourdomain.com/book/golden-gardens",
  "identifier": "golden-gardens",
  "useSlug": true,
  "venueName": "Golden Gardens Ballroom"
}
```

### Option 3: Direct from Database

Venues can query their own record:

```sql
SELECT
  COALESCE(slug, venue_id::text) as identifier,
  concat('https://yourdomain.com/book/', COALESCE(slug, venue_id::text)) as booking_url
FROM venues
WHERE venue_id = auth.uid();
```

## Slug Generation

### Automatic Slug Generation

When you run the migration `20250126000000_add_venue_slugs.sql`, it will:

1. Add a `slug` column to the `venues` table
2. Auto-generate slugs for existing venues using the format:
   ```
   venue-name-12345678
   ```
   Example: "Golden Gardens Ballroom" → `golden-gardens-ballroom-a1b2c3d4`

### Custom Slug Creation

Venues can update their slug for a cleaner URL:

```sql
UPDATE venues
SET slug = 'golden-gardens'
WHERE venue_id = auth.uid()
AND NOT EXISTS (
  SELECT 1 FROM venues WHERE slug = 'golden-gardens'
);
```

**Slug Requirements:**
- ✅ Lowercase letters (a-z)
- ✅ Numbers (0-9)
- ✅ Hyphens (-) as separators
- ✅ Must be unique across all venues
- ❌ No spaces
- ❌ No special characters
- ❌ No uppercase letters

### Slug Examples

Good slugs:
- ✅ `golden-gardens`
- ✅ `the-grand-estate-nyc`
- ✅ `riverside-venue-2024`
- ✅ `downtown-ballroom`

Bad slugs:
- ❌ `Golden Gardens` (uppercase, spaces)
- ❌ `venue@location` (special characters)
- ❌ `the_grand_estate` (underscores)

## Migration Steps

### 1. Apply the Migration

```bash
npx supabase db push
```

This will add the `slug` column and auto-generate slugs for existing venues.

### 2. Regenerate TypeScript Types

```bash
npx supabase gen types typescript --linked --schema public > lib/supabase/database.types.gen.ts
```

### 3. (Optional) Update Venue Slugs

Create an admin interface or SQL script to let venues customize their slugs:

```typescript
// Example: Update slug API endpoint
export async function PATCH(request: Request) {
  const { newSlug } = await request.json();
  const supabase = await createClient();

  // Validate slug format
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(newSlug)) {
    return NextResponse.json(
      { error: 'Invalid slug format' },
      { status: 400 }
    );
  }

  // Update slug
  const { error } = await supabase
    .from('venues')
    .update({ slug: newSlug })
    .eq('venue_id', user.id);

  if (error?.code === '23505') { // Unique constraint violation
    return NextResponse.json(
      { error: 'Slug already taken' },
      { status: 409 }
    );
  }

  return NextResponse.json({ success: true });
}
```

## Implementation Details

### URL Resolution Logic

The system automatically detects whether the URL parameter is a slug or UUID:

```typescript
// Check if it looks like a UUID
const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(venueSlug);

if (isUUID) {
  // Query by venue_id
  query = query.eq('venue_id', venueSlug);
} else {
  // Query by slug
  query = query.eq('slug', venueSlug);
}
```

This means:
- ✅ Old UUID-based links continue to work
- ✅ New slug-based links work automatically
- ✅ No breaking changes

### Database Schema

```sql
CREATE TABLE venues (
  venue_id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  -- other columns...

  CONSTRAINT venues_slug_format
    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

CREATE INDEX idx_venues_slug ON venues(slug) WHERE deleted_at IS NULL;
```

## SEO Benefits

Using slugs instead of UUIDs provides:

1. **Better SEO**: Search engines prefer descriptive URLs
2. **User Trust**: Users can see where the link goes
3. **Memorability**: Easier for clients to remember and type
4. **Branding**: Reinforces venue name in the URL

### Before (UUID)
❌ `https://yourdomain.com/book/a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### After (Slug)
✅ `https://yourdomain.com/book/golden-gardens-ballroom`

## Sharing the Booking Link

Venues can share their booking link in various ways:

### 1. Website Integration
```html
<a href="https://yourdomain.com/book/golden-gardens" class="book-now-btn">
  Book Your Event
</a>
```

### 2. Social Media
```
📅 Book your dream event at Golden Gardens Ballroom
👉 https://yourdomain.com/book/golden-gardens
```

### 3. Email Signature
```
Golden Gardens Ballroom
Book Now: https://yourdomain.com/book/golden-gardens
```

### 4. QR Code
Generate a QR code pointing to the booking URL for physical marketing materials.

### 5. Iframe Embed
```html
<iframe
  src="https://yourdomain.com/book/golden-gardens"
  width="100%"
  height="800px"
  frameborder="0"
></iframe>
```

## Troubleshooting

### Slug Already Exists
If a venue tries to use a slug that's already taken:
```
Error: Slug "golden-gardens" is already in use
```

**Solution**: Choose a more specific slug:
- `golden-gardens-sf`
- `golden-gardens-downtown`
- `golden-gardens-ballroom`

### Invalid Slug Format
If a slug doesn't meet the format requirements:
```
Error: Invalid slug format
```

**Solution**: Ensure the slug:
- Is lowercase
- Uses only letters, numbers, and hyphens
- Starts and ends with a letter or number
- Doesn't have consecutive hyphens

### Slug Not Working
If the booking page returns "Venue not found":

1. Check the slug exists in the database:
   ```sql
   SELECT slug FROM venues WHERE slug = 'your-slug';
   ```

2. Verify the venue isn't deleted:
   ```sql
   SELECT slug, deleted_at FROM venues WHERE slug = 'your-slug';
   ```

3. Clear your browser cache and try again

## Best Practices

1. **Keep it Short**: Shorter slugs are easier to remember and share
2. **Include Location**: If relevant (e.g., `venue-name-sf`, `venue-name-nyc`)
3. **Avoid Numbers**: Unless necessary for uniqueness
4. **Be Descriptive**: The slug should identify the venue
5. **Don't Change Often**: Changing slugs breaks existing links

## Future Enhancements

Potential features to add:

- [ ] Admin UI for venue slug management
- [ ] Slug suggestions based on venue name
- [ ] Slug history/redirects for changed slugs
- [ ] Vanity domain support (e.g., `golden-gardens.com` → booking page)
- [ ] Analytics per booking link
- [ ] Custom booking page themes per venue
