'use client';

interface Message {
  id: string;
  sender: string;
  senderType: "client" | "venue" | "vendor" | "ai";
  content: string;
  timestamp: string;
}

interface SuggestedAction {
  id: string;
  type: "approve" | "decline" | "modify" | "custom";
  title: string;
  description?: string;
  onAction: () => void;
}

interface MessageThreadViewProps {
  threadId: string;
  participantName: string;
  participantType: "client" | "venue" | "vendor";
  eventName: string;
  messages: Message[];
  suggestedReply?: string;
  suggestedActions?: SuggestedAction[];
  mode?: "client" | "venue" | "vendor";
  onBack?: () => void;
  onSendMessage?: (message: string) => void;
  onUseSuggestedReply?: () => void;
  onAttachFile?: () => void;
}

function MessageBubble({ message }: { message: Message }) {
  const isAI = message.senderType === "ai";
  const bubbleClasses = [
    "max-w-[85%] rounded-[22px] px-4 py-3 text-sm leading-relaxed shadow-sm",
    isAI ? "bg-[#f2ece3]" : "bg-[#eedfd3]",
    "text-[#3f3a33]",
  ].join(" ");

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[#a18a72]">
        <span>{message.sender}</span>
        <span aria-hidden>•</span>
        <span className="normal-case text-[#b4a18b]">{message.timestamp}</span>
      </div>
      <div className={bubbleClasses}>{message.content}</div>
    </div>
  );
}

// Unified message thread view with AI suggestions and action panels.
export function MessageThreadView({
  participantName,
  participantType,
  eventName,
  messages,
  suggestedReply,
  suggestedActions,
  mode = "client",
  onBack,
  onSendMessage,
  onUseSuggestedReply,
  onAttachFile,
}: MessageThreadViewProps) {
  const showSuggestedActions = mode === "venue" && suggestedActions && suggestedActions.length > 0;

  return (
    <div className="flex h-full flex-col lg:flex-row lg:divide-x lg:divide-[#e7dfd4]">
      {/* Main message thread */}
      <section className="flex flex-1 flex-col">
        <header className="border-b border-[#e7dfd4] px-8 pb-5 pt-10">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#a87b3b] hover:text-[#7d6a55]"
            >
              ← Back to Messages
            </button>
          )}
          <h1 className="text-2xl font-semibold text-[#3f3a33]">{participantName}</h1>
          <p className="mt-1 text-sm text-[#6f6453]">
            Re: {eventName}
            {participantType === "vendor" && mode === "venue" && (
              <span className="ml-2 text-[#a18a72]">(Vendor)</span>
            )}
          </p>
        </header>

        <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
          <div className="flex-1 space-y-6 overflow-y-auto px-8 pt-8 pb-12">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        </div>

        <footer className="border-t border-[#e7dfd4] bg-[#f8f4ec]/85 px-8 pb-8 pt-6 backdrop-blur">
          {suggestedReply && (
            <div className="mb-4 rounded-2xl border border-[#e7dfd4] bg-[#fdfaf5] px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b09c86]">
                    Suggested reply
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#6f6453]">{suggestedReply}</p>
                </div>
                <button
                  type="button"
                  onClick={onUseSuggestedReply}
                  className="inline-flex items-center justify-center rounded-full bg-[#f2c5ab] px-3 py-2 text-xs font-semibold text-[#744930] transition hover:bg-[#f0b295]"
                >
                  Use This
                </button>
              </div>
            </div>
          )}

          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const message = formData.get("message") as string;
              if (message && onSendMessage) {
                onSendMessage(message);
                e.currentTarget.reset();
              }
            }}
          >
            <label
              className="block text-[11px] font-medium uppercase tracking-[0.2em] text-[#b09c86]"
              htmlFor="message-input"
            >
              Your message
            </label>
            <div className="rounded-[22px] border border-[#e7dfd4] bg-white px-4 py-3 shadow-inner transition focus-within:border-[#d9c8b5] focus-within:ring-2 focus-within:ring-[#f4d8c4]">
              <textarea
                id="message-input"
                name="message"
                className="h-24 w-full resize-none border-none bg-transparent text-sm text-[#3f3a33] outline-none placeholder:text-[#c0b3a1]"
                placeholder="Type your message..."
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onAttachFile}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e7dfd4] text-sm text-[#8e806c] transition hover:bg-[#f1e9df]"
                aria-label="Attach file"
              >
                📎
              </button>
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

      {/* Suggested actions panel (venue only) */}
      {showSuggestedActions && (
        <aside className="w-full lg:w-80 bg-[#fdfaf5] px-6 py-8">
          <h2 className="text-sm font-semibold text-[#4d463b]">Suggested Actions</h2>
          <p className="mt-1 text-xs text-[#a18a72]">AI-generated based on the conversation</p>
          <div className="mt-6 space-y-4">
            {suggestedActions?.map((action) => (
              <div
                key={action.id}
                className="rounded-2xl border border-[#e7dfd4] bg-white px-4 py-4"
              >
                <p className="text-sm font-semibold text-[#3f3a33]">{action.title}</p>
                {action.description && (
                  <p className="mt-1 text-xs text-[#6f6453]">{action.description}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {action.type === "approve" && (
                    <>
                      <button
                        type="button"
                        onClick={action.onAction}
                        className="inline-flex items-center justify-center rounded-full bg-[#e4f1e6] px-3 py-1.5 text-xs font-semibold text-[#3c8650] transition hover:bg-[#d4e6d6]"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full border border-[#e7dfd4] px-3 py-1.5 text-xs font-medium text-[#6f6453] transition hover:bg-[#f1e9df]"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full border border-[#e7dfd4] px-3 py-1.5 text-xs font-medium text-[#6f6453] transition hover:bg-[#f1e9df]"
                      >
                        Modify
                      </button>
                    </>
                  )}
                  {action.type === "custom" && (
                    <button
                      type="button"
                      onClick={action.onAction}
                      className="inline-flex items-center justify-center rounded-full bg-[#f0bda4] px-3 py-1.5 text-xs font-semibold text-[#624230] transition hover:bg-[#eba98a]"
                    >
                      Take Action
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}
