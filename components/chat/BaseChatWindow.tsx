'use client';

interface Message {
  id: string;
  role: "user" | "assistant";
  name: string;
  timestamp: string;
  content: string;
}

interface ChatConfig {
  title: string;
  subtitle: string;
  placeholder: string;
  label: string;
  assistantLabel: string;
}

interface BaseChatWindowProps {
  messages: Message[];
  suggestedReply?: string;
  config: ChatConfig;
  onSendMessage?: (message: string) => void;
  onUseSuggestedReply?: () => void;
  onDismissSuggestion?: () => void;
}

function MessageBubble({ role, name, timestamp, content }: Message) {
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

// Reusable chat window component for client and venue AI assistants.
export function BaseChatWindow({
  messages,
  suggestedReply,
  config,
  onSendMessage,
  onUseSuggestedReply,
  onDismissSuggestion,
}: BaseChatWindowProps) {
  return (
    <section className="flex h-full min-h-0 flex-1 flex-col bg-[#f8f4ec]">
      <header className="border-b border-[#e7dfd4] px-8 pb-5 pt-10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b09c86]">
              {config.assistantLabel}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-[#3f3a33]">{config.title}</h2>
            <p className="mt-2 text-xs text-[#8e806c]">{config.subtitle}</p>
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

      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <div className="flex-1 space-y-6 overflow-y-auto px-8 pt-8 pb-12 text-[#3f3a33]">
          {messages.map((message) => (
            <MessageBubble key={message.id} {...message} />
          ))}
        </div>
      </div>

      <footer className="border-t border-[#e7dfd4] bg-[#f8f4ec]/85 px-8 pb-8 pt-6 backdrop-blur">
        {suggestedReply ? (
          <div className="rounded-2xl border border-[#e7dfd4] bg-[#fdfaf5] px-4 py-3 text-xs text-[#7c6e5b]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b09c86]">Suggested reply</p>
                <p className="mt-1 leading-relaxed text-[#6f6453]">{suggestedReply}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={onUseSuggestedReply}
                  className="inline-flex items-center justify-center rounded-full bg-[#f2c5ab] px-3 py-2 text-xs font-semibold text-[#744930] transition hover:bg-[#f0b295]"
                >
                  Use reply
                </button>
                <button
                  type="button"
                  onClick={onDismissSuggestion}
                  className="inline-flex items-center justify-center rounded-full border border-[#e7dfd4] px-3 py-2 text-xs font-medium text-[#8e806c] transition hover:bg-[#f1e9df]"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <form className="mt-4 space-y-3" onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const message = formData.get('message') as string;
          if (message && onSendMessage) {
            onSendMessage(message);
            e.currentTarget.reset();
          }
        }}>
          <label className="block text-[11px] font-medium uppercase tracking-[0.2em] text-[#b09c86]" htmlFor="assistant-message">
            {config.label}
          </label>
          <div className="rounded-[22px] border border-[#e7dfd4] bg-white px-4 py-3 shadow-inner transition focus-within:border-[#d9c8b5] focus-within:ring-2 focus-within:ring-[#f4d8c4]">
            <textarea
              id="assistant-message"
              name="message"
              className="h-24 w-full resize-none border-none bg-transparent text-sm text-[#3f3a33] outline-none placeholder:text-[#c0b3a1]"
              placeholder={config.placeholder}
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
      </footer>
    </section>
  );
}
