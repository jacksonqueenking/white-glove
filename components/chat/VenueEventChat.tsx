'use client';

/**
 * Venue Event Chat Component
 *
 * Chat interface for venue staff to manage a specific event.
 * Uses Vercel AI SDK with the venue_event agent.
 */

import { ChatInterface } from './ChatInterface';

interface VenueEventChatProps {
  venueId: string;
  eventId: string;
  className?: string;
}

export function VenueEventChat({ venueId, eventId, className }: VenueEventChatProps) {
  return (
    <ChatInterface
      agentType="venue_event"
      eventId={eventId}
      venueId={venueId}
      className={className}
      title="Event Coordinator"
      subtitle="I'm here to help coordinate all aspects of this event."
    />
  );
}
