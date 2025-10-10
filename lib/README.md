# Lib Directory

This folder contains domain logic and integrations that power the platform behind the scenes. Modules are organized to match the architecture documentation:
- `ai/`: LangGraph orchestration, state management, and AI tool definitions.
- `agents/`: Persona-specific assistants (client, venue) and vendor relay helpers.
- `auth/`: Supabase authentication helpers for magic links and password flows.
- `db/`: Database clients, schema helpers, and Redis connections.
- `forms/`: Builders for orchestrator-generated dynamic forms.
- `messaging/`: Message thread coordination and routing logic.
- `notifications/`: Cross-channel notification delivery (in-app, email, SMS stubs).
- `payments/`: Stripe integration surface (checkout, webhooks, payouts).
- `realtime/`: Supabase real-time channel subscriptions and WebSocket helpers.
- `tasks/`: Task lifecycle helpers for creation, updates, and completion reporting.
- `workflows/`: Higher-level orchestration and decision policies that respond to system events.

Each module currently exports scaffolded functions or classes that describe expected responsibilities and dependencies.
