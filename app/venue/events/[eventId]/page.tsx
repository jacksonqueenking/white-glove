import { EventDetailPanelRealtime } from "../../../../components/event/EventDetailPanelRealtime";
import { createClient } from "../../../../lib/supabase/server";
import { getEvent } from "../../../../lib/db/events";
import { notFound } from "next/navigation";

interface VenueEventPageProps {
  params: Promise<{ eventId: string }>;
}

// Venue-facing event hub using shared layout with chat sidebar.
export default async function VenueEventPage({ params }: VenueEventPageProps) {
  const { eventId } = await params;
  const supabase = await createClient();

  // Verify event exists (quick check before loading the real-time component)
  const event = await getEvent(supabase, eventId);

  if (!event) {
    notFound();
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
