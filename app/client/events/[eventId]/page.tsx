import { EventDetailPanel } from "../../../../components/event/EventDetailPanel";
import type { CalendarItem, EventTask, EventElement } from "../../../../components/event/EventDetailPanel";
import { createClient } from "../../../../lib/supabase/server";
import { getEvent } from "../../../../lib/db/events";
import { getVenue } from "../../../../lib/db/venues";
import { notFound } from "next/navigation";

interface ClientEventPageProps {
  params: Promise<{ eventId: string }>;
}

// Split-screen event planning UI tied to the AI assistant conversation.
export default async function ClientEventPage({ params }: ClientEventPageProps) {
  const { eventId } = await params;
  const supabase = await createClient();

  // Fetch event data
  const event = await getEvent(supabase, eventId);

  if (!event) {
    notFound();
  }

  // Fetch venue data
  let venueName = "No venue assigned";
  if (event.venue_id) {
    const venue = await getVenue(supabase, event.venue_id);
    if (venue) {
      venueName = venue.name;
    }
  }

  // Format event date and time
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Transform event data to match EventDetailPanel format (client mode)
  const eventData = {
    id: event.event_id,
    name: event.name,
    venue: venueName,
    date: formattedDate,
    time: formattedTime,
    guestCount: 0, // TODO: Get from guests table
    planner: "TBD", // TODO: Get venue contact person
    summary: event.description || "No description provided",
  };

  // TODO: Fetch event elements from event_elements table
  const elements: EventElement[] = [];

  // TODO: Fetch tasks from tasks table
  const tasks: EventTask[] = [];

  // TODO: Extract calendar items from event.calendar field
  const calendar: CalendarItem[] = [];

  return (
    <section className="mx-auto max-w-6xl">
      <EventDetailPanel
        event={eventData}
        elements={elements}
        tasks={tasks}
        calendar={calendar}
        mode="client"
      />
    </section>
  );
}
