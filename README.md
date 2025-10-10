# Event Management Platform

## Vision & Purpose

This platform revolutionizes event planning by using AI to orchestrate seamless communication and coordination between clients, venues, and vendors. Instead of endless email chains and manual coordination, an intelligent AI orchestrator manages workflows, creates tasks, and facilitates communication—making event planning delightful rather than stressful.

### The Problem We Solve

Event planning involves complex coordination between multiple parties:
- **Clients** want their vision realized without managing countless details
- **Venues** need to manage multiple events, vendors, and client requests efficiently
- **Vendors** need clear specifications and timely communication about their services

Traditional solutions rely on manual coordination, leading to miscommunication, delays, and stress.

### Our Solution

An AI-powered platform where:
- **Clients** chat with an AI assistant that understands their needs and coordinates everything
- **Venues** get an AI assistant that manages client requests, creates tasks, and communicates with vendors
- **Vendors** receive clear specifications and communicate through structured workflows
- **An orchestrator AI** manages the entire workflow, creating tasks, routing information, and ensuring nothing falls through the cracks

## How It Works

### Three User Types, One Coordinated Experience

1. **Clients**
   - Browse venue options on venue websites
   - Submit event inquiries through embedded forms
   - Chat with AI assistant to plan their event
   - Review and approve elements, manage guests, handle payments
   - Get real-time updates on their event status

2. **Venues**
   - Receive and approve booking requests
   - Use AI assistant to manage multiple events
   - Coordinate with approved vendors
   - Track tasks and deadlines across all events
   - Manage spaces, offerings, and pricing

3. **Vendors**
   - Receive invitations from venues to join platform
   - View specifications for services needed
   - Communicate with venue AI representatives
   - Manage offerings and pricing per venue
   - Track deadlines and deliverables

### The AI Orchestrator

At the heart of the platform is a LangGraph-powered orchestrator that:
- Monitors all conversations and actions
- Creates tasks dynamically based on context
- Routes information between parties
- Generates custom forms for complex requests
- Sends notifications and escalates when needed
- Learns from each event to improve suggestions

## Tech Stack

**Frontend:**
- Next.js with TypeScript
- Tailwind CSS
- React components

**Backend & Database:**
- Supabase (primary database, auth, real-time)
- Redis (caching, session management)

**AI & Orchestration:**
- LangGraph (state management, workflow orchestration)
- Provider-agnostic LLM architecture

**Other Services:**
- Stripe (payment processing)
- Zod (TypeScript validation)
- Pre-built calendar component (TBD)

**Real-time Features:**
- Supabase real-time subscriptions for live updates
- WebSockets for chat and notifications

## Project Structure

```
/
├── README.md (this file)
├── docs/
│   ├── architecture.md
│   ├── schema.md
│   ├── onboarding-flows.md
│   ├── authentication.md
│   ├── payments.md
│   ├── ai-agents.md
│   ├── tasks-and-workflows.md
│   ├── messaging.md
│   └── frontend/
│       ├── client-interface.md
│       ├── venue-interface.md
│       └── vendor-interface.md
├── app/
│   └── README.md
├── components/
│   └── README.md
├── lib/
│   ├── tools/
│   │   └── README.md
│   ├── agents/
│   │   └── README.md
│   └── db/
│       └── README.md
├── public/
├── supabase/
│   └── README.md
└── tests/
    └── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account
- Redis instance (self-hosted or managed service)

### Environment Setup

Create a `.env.local` file with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
REDIS_URL=your_redis_url
LLM_API_KEY=your_llm_api_key
```

### Installation

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to see the application.

### Database Setup

```bash
npx supabase db push
```

## Development Guidelines

### Code Organization
- Each subfolder contains a `README.md` documenting its contents
- Keep READMEs updated as files change
- Use clear, descriptive file and function names

### Testing
- All functions must have unit tests
- Run tests with `npm test`
- Aim for >80% code coverage

### LLM Tool Creation
- All CRUD and messaging functions should have docstrings
- Use well-labeled parameters
- Make functions easily callable by LLM agents
- See `/docs/ai-agents.md` for guidelines

### TypeScript & Validation
- Use Zod for all data validation
- Define schemas in `/lib/schemas/`
- Ensure type safety throughout

## Documentation Map

### Core Architecture
- [Architecture Overview](./docs/architecture.md) - System design, AI orchestration
- [Database Schema](./docs/schema.md) - All entities and relationships

### User Interfaces
- [Client Interface](./docs/frontend/client-interface.md) - Client view specifications
- [Venue Interface](./docs/frontend/venue-interface.md) - Venue view specifications
- [Vendor Interface](./docs/frontend/vendor-interface.md) - Vendor view specifications

### Features & Workflows
- [Onboarding Flows](./docs/onboarding-flows.md) - How users join the platform
- [Authentication](./docs/authentication.md) - Auth strategies and security
- [Payments](./docs/payments.md) - Stripe integration and billing
- [AI Agents](./docs/ai-agents.md) - LLM orchestration and tools
- [Tasks & Workflows](./docs/tasks-and-workflows.md) - Task system and approvals
- [Messaging](./docs/messaging.md) - Message vs chat, threading, notifications

## Roadmap

### v1.0 (MVP)
- Client onboarding via venue websites
- Basic event management
- AI-assisted planning for clients and venues
- Element selection and approval workflows
- Guest management and RSVP
- Contract and payment processing
- Task system with orchestrator

### v1.1
- Vendor onboarding and management
- Enhanced vendor workflows
- Calendar improvements
- Advanced analytics

### v2.0
- Progressive Web App (PWA)
- Mobile optimization
- Alternative client onboarding paths
- Enhanced AI capabilities
- Multi-language support

## Contributing

This is a closed-source project. For questions or contributions, contact the development team.

## License

Proprietary - All rights reserved