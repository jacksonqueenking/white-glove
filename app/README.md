# App Directory Overview

This directory implements the Next.js App Router surface for the event management platform. Top-level routes mirror the three user experiences (client, venue, vendor) plus shared auth flows and API endpoints described in the architecture docs.

## Route Structure
- `client/`: Client-facing chat-first event planning experience with split-screen layout and contextual pages (event overview, guests, contract/billing).
- `venue/`: Venue operations console for managing spaces, tasks, messages, and vendor coordination.
- `vendor/`: Vendor portal for reviewing assignments, messaging venues, and confirming deliverables.
- `(auth)/`: Shared authentication flows (magic links, password fallback) grounded in Supabase Auth configuration.

API routes under `app/api` expose orchestrator hooks, messaging gateways, task endpoints, and payment integrations that align with Supabase, Redis, LangGraph, and Stripe responsibilities in the docs.

Each subdirectory currently contains placeholders that outline expected UI or server responsibilities, ready to be replaced with fully implemented components.
