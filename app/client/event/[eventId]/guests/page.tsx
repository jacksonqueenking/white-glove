import { GuestList } from "../../../../../components/event/GuestList";

interface GuestPageProps {
  params: Promise<{ eventId: string }>;
}

const GUESTS = [
  { id: "1", name: "Jane Smith", email: "jane@example.com", phone: "(555) 123-4567", rsvp: "yes" as const, dietary: "" },
  { id: "2", name: "John Doe", email: "john@example.com", phone: "(555) 234-5678", rsvp: "yes" as const, dietary: "Vegan" },
  { id: "3", name: "Sarah Johnson", email: "sarah@example.com", phone: "(555) 345-6789", rsvp: "yes" as const, dietary: "Gluten-free" },
  { id: "4", name: "Mike Wilson", email: "mike@example.com", phone: "(555) 456-7890", rsvp: "no" as const },
  { id: "5", name: "Emily Davis", email: "emily@example.com", phone: "", rsvp: "pending" as const },
];

// Client guests management with add, edit, import, and RSVP tracking.
export default async function ClientGuestsPage({ params }: GuestPageProps) {
  const { eventId } = await params;

  return (
    <GuestList
      guests={GUESTS}
      eventId={eventId}
      mode="client"
    />
  );
}
