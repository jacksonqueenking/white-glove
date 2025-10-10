const HISTORY = [
  {
    id: "h1",
    title: "Menu options",
    summary: "Compared buffet vs plated dinner and captured preferences.",
    timestamp: "Oct 3 • 5:20 PM",
  },
  {
    id: "h2",
    title: "Photography follow-up",
    summary: "Coordinated shot list tasks and vendor hand-off.",
    timestamp: "Oct 5 • 2:10 PM",
  },
  {
    id: "h3",
    title: "Initial planning call",
    summary: "Recorded ceremony vision, guest count, and budget guardrails.",
    timestamp: "Oct 1 • 9:00 AM",
  },
];

// Horizontal history cards shown beneath the chat per client interface spec.
export function ChatHistoryList() {
  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Recent conversations</h3>
        <button
          type="button"
          className="text-xs font-medium text-slate-500 transition hover:text-slate-700"
        >
          View all
        </button>
      </header>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {HISTORY.map((item) => (
          <article
            key={item.id}
            className="flex min-w-[200px] flex-1 flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <header className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-800">{item.title}</h4>
                <p className="mt-1 text-xs text-slate-500">{item.timestamp}</p>
              </div>
              <button
                type="button"
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label={`Conversation actions for ${item.title}`}
              >
                ⋯
              </button>
            </header>
            <p className="mt-3 text-xs text-slate-600">{item.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
