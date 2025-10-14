'use client';

/**
 * Venue General Chat Component
 *
 * Chat interface for venue-wide operations.
 * Uses ChatKit with the venue_general agent.
 */

import { ChatKitWrapper } from './ChatKitWrapper';

interface VenueGeneralChatProps {
  venueId: string;
  className?: string;
}

export function VenueGeneralChat({ venueId, className }: VenueGeneralChatProps) {
  return (
    <ChatKitWrapper
      agentType="venue_general"
      venueId={venueId}
      className={className}
      title="Venue Management Assistant"
      subtitle="Ask me anything about your venue, events, or vendors."
    />
  );
}
