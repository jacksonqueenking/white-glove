-- Fix infinite recursion in elements and event_elements policies
--
-- The problem: When querying elements, the "Clients view event elements" policy
-- checks event_elements, which can cause recursion loops.
--
-- Solution: Simplify policies to avoid circular dependencies between
-- elements, event_elements, and events tables.

-- ============================================================================
-- DROP PROBLEMATIC POLICIES
-- ============================================================================

-- Drop the client policy that causes recursion
DROP POLICY IF EXISTS "Clients view event elements" ON elements;

-- ============================================================================
-- KEEP EXISTING WORKING POLICIES
-- ============================================================================

-- The following policies already exist and work correctly:
-- "Venues manage own elements" - venues can manage elements for their venue_vendors
-- "Vendors manage own elements" - vendors can manage their own elements

-- We don't need a separate client policy for elements because:
-- 1. Clients interact with elements through event_elements, not directly
-- 2. Clients can see elements when they view their events (via joins in queries)
-- 3. Direct element queries by clients are not needed for the application flow
