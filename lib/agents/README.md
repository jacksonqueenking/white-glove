# AI Agent System

This directory contains the complete AI agent system for the White Glove event management platform.

## Overview

The platform uses multiple AI agents, each with specific roles and capabilities:

1. **Client Agent** - Helps clients plan their events
2. **Venue General Agent** - Manages venue-wide operations (all events, vendors)
3. **Venue Event Agent** - Manages a specific event in detail
4. **Vendor Interface** - Vendors don't have AI agents, but receive AI-generated suggestions

## Architecture

### Why Two Venue Agents?

The venue has TWO different agents for different contexts:

**Venue General Agent:**
- Sees ALL events at the venue
- Manages vendor relationships and approvals
- Creates and edits venue offerings (elements)
- Provides high-level overviews and analytics
- Does NOT have event-specific tools

**Venue Event Agent:**
- Focused on ONE specific event
- Has complete context for that event
- Full control over event elements, guests, tasks
- Handles detailed coordination with client and vendors
- Event-specific tools only

This separation prevents context overload and keeps tools focused.

## Files

- `prompts.ts` - System prompt generators for each agent type
- `tools.ts` - OpenAI-compatible tool definitions for each agent
- `index.ts` - Main export with usage examples
- `clientAssistant.ts` - Client assistant implementation (placeholder)
- `venueAssistant.ts` - Venue assistant implementation (placeholder)
- `vendorRelay.ts` - Helper for relaying messages to vendors

## Usage

See the main export file for detailed usage examples.
