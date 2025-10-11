import { GuestList } from "../../../../../components/event/GuestList";

interface VenueGuestsPageProps {
  params: Promise<{ eventId: string }>;
}

const GUESTS = [
  { id: "1", name: "Jane Smith", email: "jane@example.com", rsvp: "yes" as const, dietary: "" },
  { id: "2", name: "John Doe", email: "john@example.com", rsvp: "yes" as const, dietary: "Vegan" },
  { id: "3", name: "Sarah Johnson", email: "sarah@example.com", rsvp: "yes" as const, dietary: "Gluten-free" },
  { id: "4", name: "Mike Wilson", email: "mike@example.com", rsvp: "no" as const },
  { id: "5", name: "Emily Davis", email: "emily@example.com", rsvp: "pending" as const },
];

// Venue view of guest list (read-only) with RSVP summary and dietary restrictions.
export default async function VenueGuestsPage({ params }: VenueGuestsPageProps) {
  const { eventId } = await params;

  return (
    <GuestList
      guests={GUESTS}
      eventId={eventId}
      mode="venue"
    />
  );
}
