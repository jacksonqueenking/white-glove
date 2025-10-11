import { VenueChatWindow } from "../../../../components/venue/VenueChatWindow";
import { EventDetailPanel } from "../../../../components/event/EventDetailPanel";
import type { CalendarItem, EventTask, EventElement } from "../../../../components/event/EventDetailPanel";

interface VenueEventPageProps {
  params: Promise<{ eventId: string }>;
}

const EVENT_DATA = {
  name: "Smith Wedding",
  clientName: "Jane Smith",
  date: "October 15, 2025",
  time: "5:00 PM – 11:00 PM",
  guestCount: 150,
  budget: "$15,000",
  spaces: ["Main Ballroom"],
  summary:
    "Elegant evening wedding with seated dinner service, live music, and floral installations throughout the venue.",
};

const ELEMENTS: EventElement[] = [
  {
    id: "venue",
    name: "Venue Rental",
    status: "completed" as const,
    price: "$2,500",
    vendor: "The Grand Ballroom",
    vendorId: "venue-1",
    description: "Main ballroom reserved with setup access beginning at 8:00 AM.",
    notes: "Contract signed and deposit paid. Final walkthrough scheduled for Oct 8.",
    internalNotes: "Setup crew confirmed. Remind staff about parking restrictions on event day.",
    files: [
      { id: "f1", name: "Contract_Signed.pdf", url: "#" },
      { id: "f2", name: "Floorplan_Final.pdf", url: "#" },
    ],
    actions: ["View Contract", "Message Client"],
  },
  {
    id: "catering",
    name: "Catering",
    status: "in_progress" as const,
    price: "$8,000",
    vendor: "Bella's Catering",
    vendorId: "vendor-1",
    description: "Plated dinner for 150 guests with vegetarian options under review.",
    notes: "Awaiting confirmation on vegetarian menu adjustments requested Oct 5.",
    internalNotes: "Bella confirmed gluten-free options available. Need final headcount by Oct 8.",
    files: [{ id: "f3", name: "Menu_Proposal.pdf", url: "#" }],
    actions: ["Message Vendor", "Update Status"],
  },
  {
    id: "photography",
    name: "Photography",
    status: "attention" as const,
    price: "$2,000",
    vendor: "Lens & Light Photography",
    vendorId: "vendor-2",
    description: "Full-day coverage with second shooter and photo booth add-on.",
    notes: "Vendor needs client shot list by Oct 10. Task created in assistant.",
    internalNotes: "Photographer requested venue lighting test. Schedule for Oct 7.",
    actions: ["Message Vendor", "Create Task"],
  },
  {
    id: "floral",
    name: "Floral Installations",
    status: "todo" as const,
    price: "TBD",
    vendor: "Petals & Co.",
    vendorId: "vendor-3",
    description: "Custom ceremony arch, table centerpieces, and cocktail arrangements.",
    notes: "Client reviewing proposals for color palette updates.",
    internalNotes: "Florist needs access at 6 AM for setup. Coordinate with security.",
    actions: ["Assign Vendor", "Request Proposal"],
  },
];

const TASKS: EventTask[] = [
  {
    id: "task-1",
    title: "Confirm catering headcount with Bella's",
    due: "Due Oct 8",
    status: "waiting",
  },
  {
    id: "task-2",
    title: "Schedule venue lighting test for photographer",
    due: "Due Oct 7",
    status: "upcoming",
  },
  {
    id: "task-3",
    title: "Coordinate early access for florist setup",
    due: "Due Oct 14",
    status: "upcoming",
  },
];

const CALENDAR_ITEMS: CalendarItem[] = [
  {
    id: "cal-1",
    date: "Oct 7",
    time: "3:00 PM",
    label: "Lighting test with photographer",
    description: "Lens & Light Photography will test venue lighting for optimal shot planning.",
  },
  {
    id: "cal-2",
    date: "Oct 8",
    time: "EOD",
    label: "Final catering headcount deadline",
    description: "Submit final guest count to Bella's Catering for accurate food preparation.",
  },
  {
    id: "cal-3",
    date: "Oct 14",
    time: "6:00 AM",
    label: "Florist setup access",
    description: "Petals & Co. arrives for ceremony arch and table centerpiece installation.",
  },
];

// Venue-facing event hub with split-screen layout: chat + event detail panel.
export default async function VenueEventPage({ params }: VenueEventPageProps) {
  const { eventId } = await params;

  return (
    <div className="grid gap-6 lg:grid-cols-2 h-full">
      <div className="flex flex-col min-h-0">
        <VenueChatWindow />
      </div>
      <div className="flex flex-col min-h-0 overflow-auto">
        <EventDetailPanel
          event={{ ...EVENT_DATA, id: eventId }}
          elements={ELEMENTS}
          tasks={TASKS}
          calendar={CALENDAR_ITEMS}
          mode="venue"
        />
      </div>
    </div>
  );
}
