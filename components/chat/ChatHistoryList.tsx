const HISTORY_ITEMS = [
  {
    id: "h1",
    title: "Menu refinements",
    summary: "Captured vegetarian requests and pricing update for Bella's Catering.",
    timestamp: "Yesterday • 4:36 PM",
  },
  {
    id: "h2",
    title: "Photography planning",
    summary: "Drafted shot list outline and shared vendor hand-off notes.",
    timestamp: "Oct 8 • 11:15 AM",
  },
  {
    id: "h3",
    title: "Decor vision",
    summary: "Logged floral palette inspiration and ceremony layout preferences.",
    timestamp: "Oct 6 • 6:05 PM",
  },
];

// Recent conversation cards shown beneath the chat window.
export function ChatHistoryList() {
  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#665949]">Recent conversations</h3>
        <button
          type="button"
          className="text-xs font-medium text-[#a18a72] transition hover:text-[#7d6a55]"
        >
          View all
        </button>
      </header>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {HISTORY_ITEMS.map((item) => (
          <article
            key={item.id}
            className="glass-card flex min-w-[220px] flex-1 flex-col justify-between rounded-2xl px-4 py-5"
          >
            <header className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-[#3f3a33]">{item.title}</h4>
                <p className="mt-1 text-xs text-[#a18a72]">{item.timestamp}</p>
              </div>
              <button
                type="button"
                className="rounded-full px-2 py-1 text-xs text-[#b9a791] transition hover:bg-[#f1e9df] hover:text-[#7d6a55]"
                aria-label={`Conversation options for ${item.title}`}
              >
                ⋯
              </button>
            </header>
            <p className="mt-3 text-xs leading-relaxed text-[#6f6453]">{item.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
