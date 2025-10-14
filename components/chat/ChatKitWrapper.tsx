'use client';

/**
 * ChatKit Wrapper Component
 *
 * Integrates OpenAI's ChatKit for event planning chat interfaces.
 * Replaces the custom chat UI with ChatKit's plug-and-play solution.
 */

import { useEffect } from 'react';
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
  const { control } = useChatKit({
    api: {
      async getClientSecret(existingSecret) {
        // Build query parameters
        const params = new URLSearchParams({
          agentType,
        });

        if (eventId) {
          params.append('eventId', eventId);
        }

        if (venueId) {
          params.append('venueId', venueId);
        }

        // Fetch session from our API
        const res = await fetch(`/api/chatkit/session?${params.toString()}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error('Failed to create ChatKit session');
        }

        const data = await res.json();
        return data.client_secret;
      },
    },
    // Optional: Configure theme to match our design system
    // Note: Theme configuration may vary based on ChatKit version
    // Uncomment and adjust when ChatKit theming is finalized
    // theme: {
    //   color: '#f0bda4', // Primary color
    // },
    // Optional: Start screen configuration
    // Note: Start screen configuration may vary based on ChatKit version
    // Uncomment and adjust when ChatKit API is finalized
    // startScreen: {
    //   heading: title || getDefaultTitle(agentType),
    //   description: subtitle || getDefaultSubtitle(agentType),
    // },
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
      return 'Chat naturally and I\'ll coordinate updates with your venue and vendors automatically.';
    case 'venue_general':
      return 'Ask me anything about your venue, events, or vendors.';
    case 'venue_event':
      return 'I\'m here to help coordinate all aspects of this event.';
    default:
      return 'How can I help you today?';
  }
}
