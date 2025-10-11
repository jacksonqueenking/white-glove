import { EventDetailPanel } from "../../../../components/client/EventDetailPanel";
import type { CalendarItem, EventTask } from "../../../../components/client/EventDetailPanel";

interface ClientEventPageProps {
  params: Promise<{ eventId: string }>;
}

const EVENT_DATA = {
  name: "Smith Wedding",
  venue: "The Grand Ballroom",
  date: "October 15, 2025",
  time: "5:00 PM – 11:00 PM",
  guestCount: 150,
  planner: "Lena Williams",
  summary:
    "Elegant evening wedding with seated dinner service, live music, and floral installations throughout the venue.",
};

const ELEMENTS = [
  {
    id: "venue",
    name: "Venue Rental",
    status: "completed" as const,
    price: "$2,500",
    vendor: "The Grand Ballroom",
    description: "Main ballroom reserved with setup access beginning at 8:00 AM.",
    notes: "Contract signed and deposit paid. Final walkthrough scheduled for Oct 8.",
    actions: ["View Contract", "Message Venue"],
  },
  {
    id: "catering",
    name: "Catering",
    status: "in_progress" as const,
    price: "$8,000",
    vendor: "Bella's Catering",
    description: "Plated dinner for 150 guests with vegetarian options under review.",
    notes: "Awaiting confirmation on vegetarian menu adjustments requested Oct 5.",
    actions: ["Approve Menu", "Request Change"],
  },
  {
    id: "photography",
    name: "Photography",
    status: "attention" as const,
    price: "$2,000",
    vendor: "Lens & Light Photography",
    description: "Full-day coverage with second shooter and photo booth add-on.",
    notes: "Vendor needs client shot list by Oct 10. Task created in assistant.",
    actions: ["Upload Shot List", "Message Venue"],
  },
  {
    id: "floral",
    name: "Floral Installations",
    status: "todo" as const,
    price: "TBD",
    vendor: "Petals & Co.",
    description: "Custom ceremony arch, table centerpieces, and cocktail arrangements.",
    notes: "Client reviewing proposals for color palette updates.",
    actions: ["Review Proposal", "Request Meeting"],
  },
];

const TASKS: EventTask[] = [
  {
    id: "task-1",
    title: "Approve catering menu adjustments",
    due: "Due Oct 8",
    status: "waiting",
  },
  {
    id: "task-2",
    title: "Upload photography shot list",
    due: "Due Oct 10",
    status: "upcoming",
  },
  {
    id: "task-3",
    title: "Review floral proposals from Petals & Co.",
    due: "Review by Oct 12",
    status: "upcoming",
  },
];

const CALENDAR_ITEMS: CalendarItem[] = [
  {
    id: "cal-1",
    date: "Oct 8",
    time: "2:00 PM",
    label: "Catering menu review",
    description: "Confirm vegetarian adjustments with Bella's Catering before sending approvals.",
  },
  {
    id: "cal-2",
    date: "Oct 10",
    time: "All day",
    label: "Photography shot list",
    description: "Share final shot list with Lens & Light Photography for weekend prep.",
  },
  {
    id: "cal-3",
    date: "Oct 12",
    label: "Floral palette feedback",
    description: "Provide feedback on Petals & Co. palette update to confirm installations.",
  },
];

// Split-screen event planning UI tied to the AI assistant conversation.
export default async function ClientEventPage({ params }: ClientEventPageProps) {
  const { eventId } = await params;

  return (
    <section className="mx-auto max-w-6xl">
      <EventDetailPanel
        event={{ ...EVENT_DATA, id: eventId }}
        elements={ELEMENTS}
        tasks={TASKS}
        calendar={CALENDAR_ITEMS}
      />
    </section>
  );
}
