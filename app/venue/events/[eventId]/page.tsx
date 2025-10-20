import { EventDetailPanel } from "../../../../components/event/EventDetailPanel";
import type { CalendarItem, EventTask, EventElement } from "../../../../components/event/EventDetailPanel";
import { createClient } from "../../../../lib/supabase/server";
import { getEvent } from "../../../../lib/db/events";
import { getClient } from "../../../../lib/db/clients";
import { notFound } from "next/navigation";

interface VenueEventPageProps {
  params: Promise<{ eventId: string }>;
}

// Venue-facing event hub using shared layout with chat sidebar.
export default async function VenueEventPage({ params }: VenueEventPageProps) {
  const { eventId } = await params;
  const supabase = await createClient();

  // Fetch event data
  const event = await getEvent(supabase, eventId);

  if (!event) {
    notFound();
  }

  // Fetch client data if client_id exists
  let clientName = "No client assigned";
  if (event.client_id) {
    const client = await getClient(supabase, event.client_id);
    if (client) {
      clientName = client.name;
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

  // Transform event data to match EventDetailPanel format
  const eventData = {
    id: event.event_id,
    name: event.name,
    clientName,
    date: formattedDate,
    time: formattedTime,
    guestCount: 0, // TODO: Get from guests table
    budget: "TBD", // TODO: Calculate from event_elements
    spaces: ["TBD"], // TODO: Get from event_spaces
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
        mode="venue"
      />
    </section>
  );
}
