interface ClientEventPageProps {
  params: Promise<{ eventId: string }>;
}

const STATUS_TOKENS: Record<
  "todo" | "in_progress" | "completed" | "attention",
  { label: string; tone: string }
> = {
  todo: { label: "To do", tone: "text-rose-500" },
  in_progress: { label: "In progress", tone: "text-amber-500" },
  completed: { label: "Complete", tone: "text-emerald-500" },
  attention: { label: "Needs attention", tone: "text-orange-600" },
};

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

// Split-screen event planning UI tied to the AI assistant conversation.
export default async function ClientEventPage({ params }: ClientEventPageProps) {
  const { eventId } = await params;
  const highlightedElement = ELEMENTS[1];

  return (
    <section className="space-y-8">
      <header className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Event</p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-900">{EVENT_DATA.name}</h1>
            <p className="mt-2 text-sm text-slate-600">
              Coordinated by {EVENT_DATA.planner} • Guest count: {EVENT_DATA.guestCount}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="flex items-center gap-2 font-medium text-slate-700">
              <span aria-hidden>📍</span>
              {EVENT_DATA.venue}
            </p>
            <p className="mt-2 flex items-center gap-2">
              <span aria-hidden>📅</span>
              {EVENT_DATA.date}
            </p>
            <p className="mt-1 flex items-center gap-2">
              <span aria-hidden>⏰</span>
              {EVENT_DATA.time}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-600">{EVENT_DATA.summary}</p>
        <p className="mt-2 text-xs text-slate-500">Event ID: {eventId}</p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <header className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Elements</h2>
              <span className="text-xs text-slate-500">Status at a glance</span>
            </header>
            <ul className="mt-4 space-y-2">
              {ELEMENTS.map((element) => {
                const token = STATUS_TOKENS[element.status];
                const isActive = element.id === highlightedElement.id;

                return (
                  <li key={element.id}>
                    <button
                      type="button"
                      className={[
                        "flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors",
                        isActive
                          ? "border-blue-200 bg-blue-50"
                          : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50",
                      ].join(" ")}
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-700">{element.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{element.vendor}</p>
                      </div>
                      <span className={`text-xs font-medium ${token.tone}`}>
                        {token.label === "Needs attention" ? "❗" : "●"} {token.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                View Contract
              </button>
              <button
                type="button"
                className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                Manage Guests
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-700">Next Actions</h2>
            <ul className="mt-3 space-y-2 text-xs text-slate-600">
              <li>• Approve catering menu adjustments</li>
              <li>• Upload photography shot list by Oct 10</li>
              <li>• Review floral proposals from Petals &amp; Co.</li>
            </ul>
          </section>
        </aside>

        <section className="space-y-4">
          <header className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Focused element</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">{highlightedElement.name}</h2>
              <p className="mt-2 text-sm text-slate-600">{highlightedElement.description}</p>
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-right text-sm text-slate-700">
              <p className="font-semibold">Current estimate</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{highlightedElement.price}</p>
              <p className="mt-2 text-xs text-slate-500">Provided by {highlightedElement.vendor}</p>
            </div>
          </header>

          <article className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700">What happens next</h3>
            <p className="mt-2">
              The venue is waiting for your approval on the updated vegetarian menu. Once confirmed, the AI assistant
              will notify the caterer and create any follow-up tasks needed for final guest counts.
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Notes: {highlightedElement.notes}
            </p>
          </article>

          <div className="flex flex-wrap gap-3">
            {highlightedElement.actions.map((action) => (
              <button
                key={action}
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                {action}
              </button>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
