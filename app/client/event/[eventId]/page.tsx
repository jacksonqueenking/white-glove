import { EventDetailPanel } from "../../../../components/client/EventDetailPanel";

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

const NEXT_ACTIONS = [
  "Approve catering menu adjustments",
  "Upload photography shot list by Oct 10",
  "Review floral proposals from Petals & Co.",
];

// Split-screen event planning UI tied to the AI assistant conversation.
export default async function ClientEventPage({ params }: ClientEventPageProps) {
  const { eventId } = await params;

  const statusSummary = ELEMENTS.reduce(
    (acc, element) => {
      acc[element.status] += 1;
      return acc;
    },
    { todo: 0, in_progress: 0, completed: 0, attention: 0 },
  );

  return (
    <section className="mx-auto max-w-6xl space-y-10">
      <header className="glass-card px-8 py-7">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b09c86]">Event</p>
            <h1 className="text-3xl font-semibold text-[#3f3a33]">{EVENT_DATA.name}</h1>
            <p className="text-sm text-[#6f6453]">
              Coordinated by {EVENT_DATA.planner} • Guest count: {EVENT_DATA.guestCount}
            </p>
          </div>
          <div className="glass-card flex min-w-[220px] flex-col gap-2 rounded-2xl border-[#e7dfd4] bg-[#fdfaf5] px-5 py-4 text-sm text-[#6f6453] shadow-none">
            <p className="flex items-center gap-2 font-medium text-[#4d463b]">
              <span aria-hidden>📍</span>
              {EVENT_DATA.venue}
            </p>
            <p className="flex items-center gap-2">
              <span aria-hidden>📅</span>
              {EVENT_DATA.date}
            </p>
            <p className="flex items-center gap-2">
              <span aria-hidden>⏰</span>
              {EVENT_DATA.time}
            </p>
          </div>
        </div>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[#6f6453]">{EVENT_DATA.summary}</p>
        <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[#b09c86]">Event ID • {eventId}</p>
      </header>

      <div className="grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="glass-card px-5 py-6 text-sm text-[#6f6453]">
            <h2 className="text-sm font-semibold text-[#4d463b]">Status snapshot</h2>
            <ul className="mt-4 space-y-3 text-xs">
              <li className="flex items-center justify-between">
                <span className="text-[#a18a72]">Completed</span>
                <span className="font-semibold text-[#3f3a33]">{statusSummary.completed}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[#a18a72]">In progress</span>
                <span className="font-semibold text-[#3f3a33]">{statusSummary.in_progress}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[#a18a72]">Needs attention</span>
                <span className="font-semibold text-[#3f3a33]">{statusSummary.attention}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[#a18a72]">To do</span>
                <span className="font-semibold text-[#3f3a33]">{statusSummary.todo}</span>
              </li>
            </ul>
          </section>

          <section className="glass-card px-5 py-6">
            <h2 className="text-sm font-semibold text-[#4d463b]">Quick actions</h2>
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full bg-[#f0bda4] px-4 py-2 text-sm font-semibold text-[#624230] transition hover:bg-[#eba98a]"
              >
                View contract
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-[#e7dfd4] px-4 py-2 text-sm font-medium text-[#6f6453] transition hover:bg-[#f1e9df]"
              >
                Manage guests
              </button>
            </div>
          </section>
        </aside>

        <EventDetailPanel elements={ELEMENTS} nextActions={NEXT_ACTIONS} />
      </div>
    </section>
  );
}
