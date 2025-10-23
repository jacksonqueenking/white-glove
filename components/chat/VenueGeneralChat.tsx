'use client';

/**
 * Venue General Chat Component
 *
 * Chat interface for venue-wide operations.
 * Uses Vercel AI SDK with the venue_general agent.
 */

import { ChatInterface } from './ChatInterface';

interface VenueGeneralChatProps {
  venueId: string;
  className?: string;
}

export function VenueGeneralChat({ venueId, className }: VenueGeneralChatProps) {
  return (
    <ChatInterface
      agentType="venue_general"
      venueId={venueId}
      className={className}
      title="Venue Management Assistant"
      subtitle="Ask me anything about your venue, events, or vendors."
    />
  );
}
