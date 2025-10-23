-- Add slug column to venues table
ALTER TABLE venues ADD COLUMN slug TEXT UNIQUE;

-- Create index for fast slug lookups
CREATE INDEX idx_venues_slug ON venues(slug) WHERE deleted_at IS NULL;

-- Function to generate slug from venue name
CREATE OR REPLACE FUNCTION generate_slug(name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Populate slugs for existing venues (with UUID suffix to ensure uniqueness)
UPDATE venues
SET slug = generate_slug(name) || '-' || substring(venue_id::text from 1 for 8)
WHERE slug IS NULL;

-- Make slug NOT NULL after populating existing records
ALTER TABLE venues ALTER COLUMN slug SET NOT NULL;

-- Add constraint to ensure slugs are URL-safe
ALTER TABLE venues ADD CONSTRAINT venues_slug_format
  CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- Comment
COMMENT ON COLUMN venues.slug IS 'URL-friendly slug for public booking pages (e.g., "golden-gardens-sf")';
