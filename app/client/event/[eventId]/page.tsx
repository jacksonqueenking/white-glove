interface ClientEventPageProps {
  params: Promise<{ eventId: string }>;
}

const STATUS_TOKENS: Record<
  "todo" | "in_progress" | "completed" | "attention",
  { label: string; badge: string }
> = {
  todo: { label: "To do", badge: "bg-[#f7e3dc] text-[#b16455]" },
  in_progress: { label: "In progress", badge: "bg-[#f4e7ce] text-[#a87b3b]" },
  completed: { label: "Complete", badge: "bg-[#e4f1e6] text-[#3c8650]" },
  attention: { label: "Needs attention", badge: "bg-[#fae5d4] text-[#c96f3a]" },
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

      <div className="grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="glass-card px-5 py-6">
            <header className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#4d463b]">Elements</h2>
              <span className="text-xs text-[#a18a72]">Status at a glance</span>
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
                        "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
                        isActive
                          ? "border-[#f0bda4] bg-[#fef5ef] shadow-sm"
                          : "border-transparent bg-transparent hover:border-[#f0bda4] hover:bg-[#fef5ef]",
                      ].join(" ")}
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#3f3a33]">{element.name}</p>
                        <p className="mt-1 text-xs text-[#a18a72]">{element.vendor}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${token.badge}`}>
                        {token.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-6 grid gap-2">
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

          <section className="glass-card px-5 py-5">
            <h2 className="text-sm font-semibold text-[#4d463b]">Next actions</h2>
            <ul className="mt-3 space-y-3 text-xs leading-relaxed text-[#6f6453]">
              <li className="flex gap-2">
                <span className="mt-0.5 text-[#f0bda4]">•</span>
                Approve catering menu adjustments
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 text-[#f0bda4]">•</span>
                Upload photography shot list by Oct 10
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 text-[#f0bda4]">•</span>
                Review floral proposals from Petals &amp; Co.
              </li>
            </ul>
          </section>
        </aside>

        <section className="space-y-5">
          <header className="glass-card flex flex-wrap items-start justify-between gap-6 px-7 py-6">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b09c86]">
                Focused element
              </p>
              <h2 className="text-2xl font-semibold text-[#3f3a33]">{highlightedElement.name}</h2>
              <p className="text-sm leading-relaxed text-[#6f6453]">{highlightedElement.description}</p>
            </div>
            <div className="rounded-2xl border border-[#f0bda4] bg-[#fef5ef] px-5 py-4 text-right text-sm text-[#6f6453]">
              <p className="font-semibold text-[#4d463b]">Current estimate</p>
              <p className="mt-1 text-2xl font-bold text-[#3f3a33]">{highlightedElement.price}</p>
              <p className="mt-2 text-xs text-[#a18a72]">Provided by {highlightedElement.vendor}</p>
            </div>
          </header>

          <article className="glass-card px-7 py-6 text-sm leading-relaxed text-[#6f6453]">
            <h3 className="text-sm font-semibold text-[#4d463b]">What happens next</h3>
            <p className="mt-3">
              The venue is waiting for your approval on the updated vegetarian menu. Once confirmed, the assistant will
              notify the caterer and create any follow-up tasks needed for final guest counts.
            </p>
            <p className="mt-4 rounded-2xl bg-[#fef5ef] px-4 py-3 text-xs text-[#b16455]">
              Notes: {highlightedElement.notes}
            </p>
          </article>

          <div className="flex flex-wrap gap-3">
            {highlightedElement.actions.map((action) => (
              <button
                key={action}
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-[#e7dfd4] px-4 py-2 text-sm font-medium text-[#6f6453] transition hover:bg-[#f1e9df]"
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
