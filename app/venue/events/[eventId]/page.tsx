import { createClient } from "../../../../lib/supabase/server";
import { getEvent } from "../../../../lib/db/events";
import { getEventAIChats } from "../../../../lib/db/ai-chat";
import { notFound, redirect } from "next/navigation";
import { nanoid } from "nanoid";

interface VenueEventPageProps {
  params: Promise<{ eventId: string }>;
}

// Redirects to the most recent chat or creates a new one
export default async function VenueEventPage({ params }: VenueEventPageProps) {
  const { eventId } = await params;
  const supabase = await createClient();

  // Verify event exists
  const event = await getEvent(supabase, eventId);
  if (!event) {
    notFound();
  }

  // Get all chats for this event
  const chats = await getEventAIChats(supabase, eventId);

  // If there are existing chats, redirect to the most recent one
  if (chats.length > 0) {
    redirect(`/venue/events/${eventId}/chats/${chats[0].id}`);
  }

  // Otherwise, create a new chat and redirect to it
  const newChatId = nanoid();
  redirect(`/venue/events/${eventId}/chats/${newChatId}`);
}
