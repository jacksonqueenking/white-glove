import { EventDetailPanelRealtime } from "@/components/event/EventDetailPanelRealtime";
import { createClient } from "@/lib/supabase/server";
import { getEvent } from "@/lib/db/events";
import { getAIChat, createAIChat } from "@/lib/db/ai-chat";
import { notFound } from "next/navigation";

interface VenueEventChatPageProps {
  params: Promise<{ eventId: string; chatId: string }>;
}

export default async function VenueEventChatPage({ params }: VenueEventChatPageProps) {
  const { eventId, chatId } = await params;
  const supabase = await createClient();

  // Verify event exists
  const event = await getEvent(supabase, eventId);
  if (!event) {
    notFound();
  }

  // Get or create the chat
  let chat = await getAIChat(supabase, chatId);

  // If chat doesn't exist, create it
  if (!chat) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      notFound();
    }

    // Create new chat (venue_id will be set from event data if needed)
    chat = await createAIChat(supabase, {
      id: chatId,
      user_id: user.id,
      user_type: 'venue',
      agent_type: 'venue_event',
      event_id: eventId,
      venue_id: event.venue_id || undefined,
      title: 'New Conversation',
    });
  }

  return (
    <section className="mx-auto max-w-6xl">
      <EventDetailPanelRealtime
        eventId={eventId}
        mode="venue"
      />
    </section>
  );
}
