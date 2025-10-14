'use client';

/**
 * Client Event Chat Component
 *
 * Chat interface for clients to plan their events.
 * Uses ChatKit with the client agent.
 */

import { ChatKitWrapper } from './ChatKitWrapper';

interface ClientEventChatProps {
  clientId: string;
  eventId: string;
  className?: string;
}

export function ClientEventChat({ clientId, eventId, className }: ClientEventChatProps) {
  return (
    <ChatKitWrapper
      agentType="client"
      eventId={eventId}
      className={className}
      title="White Glove Assistant"
      subtitle="Chat naturally and I'll coordinate updates with your venue and vendors automatically."
    />
  );
}
