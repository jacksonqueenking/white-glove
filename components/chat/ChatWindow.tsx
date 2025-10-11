const MESSAGES = [
  {
    id: "m1",
    role: "assistant" as const,
    name: "White Glove",
    timestamp: "2 min ago",
    content:
      "Morning, Emma! Catering is almost ready to finalize. I captured your vegetarian adjustments and highlighted the tasks we still need to close before Friday.",
  },
  {
    id: "m2",
    role: "user" as const,
    name: "You",
    timestamp: "1 min ago",
    content:
      "Perfect—can you confirm with Bella's Catering that the portobello entrée can be made gluten-free for my guests that need it?",
  },
  {
    id: "m3",
    role: "assistant" as const,
    name: "White Glove",
    timestamp: "Just now",
    content:
      "Absolutely. I can send a coordinated message to the venue and caterer, include the 12 gluten-free guests in the note, and create a follow-up task for you.",
  },
];

const SUGGESTED_REPLY =
  "Yes, send that update and set a reminder if we do not hear back by tomorrow afternoon.";

function MessageBubble({
  role,
  name,
  timestamp,
  content,
}: (typeof MESSAGES)[number]) {
  const isUser = role === "user";
  const bubbleClasses = [
    "max-w-[88%] rounded-[22px] px-4 py-3 text-sm leading-relaxed shadow-sm",
    isUser ? "bg-[#eedfd3]" : "bg-[#f2ece3]",
    "text-[#3f3a33]",
  ].join(" ");

  return (
    <div
      className={[
        "flex flex-col gap-1",
        isUser ? "items-end text-right" : "items-start text-left",
      ].join(" ")}
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[#a18a72]">
        <span>{name}</span>
        <span aria-hidden>•</span>
        <span className="normal-case text-[#b4a18b]">{timestamp}</span>
      </div>
      <div className={bubbleClasses}>{content}</div>
    </div>
  );
}

export function ChatWindow() {
  return (
    <section className="flex h-full flex-1 flex-col">
      <header className="px-8 pb-5 pt-10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b09c86]">
              Client concierge
            </p>
            <h2 className="mt-2 text-lg font-semibold text-[#3f3a33]">White Glove Assistant</h2>
            <p className="mt-2 text-xs text-[#8e806c]">
              Chat naturally and I&apos;ll coordinate updates with your venue and vendors automatically.
            </p>
          </div>
          <div className="flex gap-2 text-[#8e806c]">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e7dfd4] text-sm transition hover:bg-[#f1e9df]"
              aria-label="Assistant settings"
            >
              ⚙️
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e7dfd4] text-sm transition hover:bg-[#f1e9df]"
              aria-label="Assistant history"
            >
              ⏱
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 flex-col">
        <div className="flex-1 space-y-6 overflow-y-auto px-8 pb-12 text-[#3f3a33]">
          {MESSAGES.map((message) => (
            <MessageBubble key={message.id} {...message} />
          ))}
        </div>

        <div className="border-t border-[#e7dfd4] bg-[#f8f4ec]/80 px-8 pb-8 pt-6 backdrop-blur">
          <div className="rounded-2xl border border-[#e7dfd4] bg-[#fdfaf5] px-4 py-3 text-xs text-[#7c6e5b]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b09c86]">
                  Suggested reply
                </p>
                <p className="mt-1 leading-relaxed text-[#6f6453]">{SUGGESTED_REPLY}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full bg-[#f2c5ab] px-3 py-2 text-xs font-semibold text-[#744930] transition hover:bg-[#f0b295]"
                >
                  Use reply
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full border border-[#e7dfd4] px-3 py-2 text-xs font-medium text-[#8e806c] transition hover:bg-[#f1e9df]"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>

          <form className="mt-4 space-y-3">
            <label className="block text-[11px] font-medium uppercase tracking-[0.2em] text-[#b09c86]" htmlFor="assistant-message">
              Ask anything about your event
            </label>
            <div className="rounded-[22px] border border-[#e7dfd4] bg-white px-4 py-3 shadow-inner transition focus-within:border-[#d9c8b5] focus-within:ring-2 focus-within:ring-[#f4d8c4]">
              <textarea
                id="assistant-message"
                className="h-24 w-full resize-none border-none bg-transparent text-sm text-[#3f3a33] outline-none placeholder:text-[#c0b3a1]"
                placeholder="e.g. Remind the florist our ceremony starts at 5pm outdoors."
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-2 text-[#8e806c]">
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e7dfd4] text-sm transition hover:bg-[#f1e9df]"
                  aria-label="Add attachment"
                >
                  +
                </button>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e7dfd4] text-sm transition hover:bg-[#f1e9df]"
                  aria-label="Set priority"
                >
                  ★
                </button>
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-[#f0bda4] px-5 py-2 text-sm font-semibold text-[#624230] transition hover:bg-[#eba98a]"
              >
                Send
                <span aria-hidden>↑</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
