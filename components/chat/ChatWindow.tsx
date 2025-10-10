const MESSAGES = [
  {
    id: "m1",
    role: "assistant" as const,
    content:
      "Hi Emma! I've summarized today's planning session. Catering is awaiting your approval on the vegetarian options, and the photographer still needs the shot list.",
    timestamp: "2 min ago",
  },
  {
    id: "m2",
    role: "user" as const,
    content: "Great, can you ask Bella's Catering if the portobello option can be gluten-free?",
    timestamp: "1 min ago",
  },
  {
    id: "m3",
    role: "assistant" as const,
    content:
      "Absolutely. I can message the venue now and create a task so it does not slip. Would you like me to phrase it as a change request and note the guest count of 150?",
    timestamp: "Just now",
  },
];

const SUGGESTED_REPLY =
  "Yes, please send the change request and let them know we expect 12 gluten-free guests.";

// Chat window that mirrors the AI-assisted conversation design for clients.
export function ChatWindow() {
  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 px-5 py-4">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Client Assistant</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">Planning with your AI concierge</h2>
        <p className="mt-1 text-xs text-slate-500">
          Ask about elements, request changes, and let the assistant coordinate with venues and vendors.
        </p>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {MESSAGES.map((message) => {
          const isUser = message.role === "user";

          return (
            <div
              key={message.id}
              className={[
                "flex flex-col gap-1",
                isUser ? "items-end text-right" : "items-start text-left",
              ].join(" ")}
            >
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold">{isUser ? "You" : "AI Assistant"}</span>
                <span aria-hidden>•</span>
                <span>{message.timestamp}</span>
              </div>
              <div
                className={[
                  "max-w-[90%] rounded-2xl px-4 py-2 text-sm leading-relaxed",
                  isUser ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700",
                ].join(" ")}
              >
                {message.content}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-200 px-5 py-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <p className="font-medium text-amber-900">Suggested reply</p>
          <p className="mt-1">{SUGGESTED_REPLY}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
            >
              Use suggestion
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Dismiss
            </button>
          </div>
        </div>

        <form className="mt-4 space-y-3">
          <label className="block text-xs font-medium text-slate-600" htmlFor="assistant-message">
            Ask about your event
          </label>
          <textarea
            id="assistant-message"
            className="h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="e.g. Can you remind the venue that the rehearsal dinner is for 40 guests?"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">AI will route follow-ups to the right person automatically.</p>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Send to assistant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
