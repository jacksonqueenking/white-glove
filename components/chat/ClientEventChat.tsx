'use client';

/**
 * Client Event Chat Component
 *
 * Chat interface for clients to plan their events.
 * Uses Vercel AI SDK with the client agent.
 */

import { ChatInterface } from './ChatInterface';

interface ClientEventChatProps {
  clientId: string;
  eventId: string;
  className?: string;
}

export function ClientEventChat({ clientId, eventId, className }: ClientEventChatProps) {
  return (
    <ChatInterface
      agentType="client"
      eventId={eventId}
      className={className}
      title="White Glove Assistant"
      subtitle="Chat naturally and I'll coordinate updates with your venue and vendors automatically."
    />
  );
}
