'use client';

/**
 * ChatKit Wrapper Component
 *
 * Integrates OpenAI's ChatKit with custom backend using OpenAI Agents SDK.
 * Uses CustomApiConfig to connect to our /api/chatkit endpoint.
 */

import { useEffect, useMemo } from 'react';
import { ChatKit, useChatKit } from '@openai/chatkit-react';

interface ChatKitWrapperProps {
  /** Type of agent to use */
  agentType: 'client' | 'venue_general' | 'venue_event';
  /** Event ID (required for client and venue_event) */
  eventId?: string;
  /** Venue ID (required for venue agents) */
  venueId?: string;
  /** Optional class name for styling */
  className?: string;
  /** Chat window title */
  title?: string;
  /** Chat window subtitle */
  subtitle?: string;
}

/**
 * ChatKit component integrated with our agent system
 */
export function ChatKitWrapper({
  agentType,
  eventId,
  venueId,
  className = 'h-[600px] w-full',
  title,
  subtitle,
}: ChatKitWrapperProps) {
  // Build metadata to pass to backend
  const metadata = useMemo(() => ({
    agentType,
    eventId,
    venueId,
  }), [agentType, eventId, venueId]);

  const { control } = useChatKit({
    // Use custom backend API
    api: {
      url: '/api/chatkit',
      domainKey: process.env.NEXT_PUBLIC_CHATKIT_DOMAIN_KEY || 'domain_pk_localhost_dev',

      // Optional: Add custom headers or authentication
      async fetch(url, options) {
        // Inject metadata into all requests
        const body = options?.body ? JSON.parse(options.body as string) : {};
        const enhancedBody = {
          ...body,
          metadata, // Add agent configuration
        };

        return fetch(url, {
          ...options,
          headers: {
            ...options?.headers,
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin',
          body: JSON.stringify(enhancedBody),
        });
      },
    },

    // Theme configuration
    theme: {
      colorScheme: 'light',
      radius: 'round',
      color: {
        accent: {
          primary: '#f0bda4',
          level: 1,
        },
      },
    },

    // Start screen with prompts
    startScreen: {
      greeting: title || getDefaultTitle(agentType),
      prompts: getStarterPrompts(agentType),
    },

    // Composer configuration
    composer: {
      placeholder: subtitle || getDefaultSubtitle(agentType),
    },

    // Enable thread history
    history: {
      enabled: true,
      showDelete: true,
      showRename: true,
    },

    // Error handling
    onError: (error) => {
      console.error('[ChatKit] Error:', error);
    },
  });

  // Load ChatKit script
  useEffect(() => {
    if (typeof window !== 'undefined' && !document.getElementById('chatkit-script')) {
      const script = document.createElement('script');
      script.id = 'chatkit-script';
      script.src = 'https://cdn.platform.openai.com/deployments/chatkit/chatkit.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div className={className}>
      <ChatKit control={control} />
    </div>
  );
}

/**
 * Get default title based on agent type
 */
function getDefaultTitle(agentType: string): string {
  switch (agentType) {
    case 'client':
      return 'White Glove Assistant';
    case 'venue_general':
      return 'Venue Management Assistant';
    case 'venue_event':
      return 'Event Coordinator';
    default:
      return 'AI Assistant';
  }
}

/**
 * Get default subtitle based on agent type
 */
function getDefaultSubtitle(agentType: string): string {
  switch (agentType) {
    case 'client':
      return 'Message your assistant...';
    case 'venue_general':
      return 'Ask me anything...';
    case 'venue_event':
      return 'How can I help with this event?';
    default:
      return 'How can I help you today?';
  }
}

/**
 * Get starter prompts based on agent type
 */
function getStarterPrompts(agentType: string) {
  switch (agentType) {
    case 'client':
      return [
        { label: 'Plan my event', prompt: 'Help me start planning my event' },
        { label: 'Check status', prompt: 'What\'s the current status of my event planning?' },
        { label: 'Make changes', prompt: 'I\'d like to make some changes to my event' },
      ];
    case 'venue_general':
      return [
        { label: 'View events', prompt: 'Show me upcoming events' },
        { label: 'Manage vendors', prompt: 'Help me manage vendor relationships' },
        { label: 'Venue info', prompt: 'Tell me about my venue capabilities' },
      ];
    case 'venue_event':
      return [
        { label: 'Event details', prompt: 'Give me the current event details' },
        { label: 'Coordinate vendors', prompt: 'Help me coordinate with vendors for this event' },
        { label: 'Client updates', prompt: 'Are there any updates from the client?' },
      ];
    default:
      return [];
  }
}
