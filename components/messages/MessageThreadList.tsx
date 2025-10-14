'use client';

interface MessageThread {
  id: string;
  senderName: string;
  senderType: "client" | "venue" | "vendor";
  eventName: string;
  subject: string;
  preview: string;
  timestamp: string;
  unread: boolean;
  actionRequired?: boolean;
}

interface MessageThreadListProps {
  threads: MessageThread[];
  mode?: "client" | "venue" | "vendor";
  onThreadClick?: (threadId: string) => void;
  onCompose?: () => void;
  onSearch?: (query: string) => void;
}

// Unified message thread list for viewing conversations across all users.
export function MessageThreadList({
  threads,
  mode = "client",
  onThreadClick,
  onCompose,
  onSearch,
}: MessageThreadListProps) {
  const unreadCount = threads.filter((t) => t.unread).length;

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#3f3a33]">Messages</h1>
          <p className="mt-1 text-sm text-[#6f6453]">
            {unreadCount > 0
              ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}`
              : "All caught up"}
          </p>
        </div>
        {onCompose && (
          <button
            type="button"
            onClick={onCompose}
            className="inline-flex items-center justify-center rounded-full bg-[#f0bda4] px-5 py-2 text-sm font-semibold text-[#624230] transition hover:bg-[#eba98a]"
          >
            Compose
          </button>
        )}
      </header>

      <div className="flex items-center gap-3">
        <div className="inline-flex rounded-full bg-[#fef1e4] p-1">
          <button
            type="button"
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#3f3a33] shadow"
          >
            All
          </button>
          <button
            type="button"
            className="rounded-full px-4 py-2 text-sm font-medium text-[#a18a72] hover:text-[#7d6a55]"
          >
            Unread
          </button>
        </div>
        <div className="flex-1">
          <input
            type="search"
            placeholder="Search messages..."
            onChange={(e) => onSearch?.(e.target.value)}
            className="w-full rounded-full border border-[#e7dfd4] bg-white px-4 py-2 text-sm text-[#3f3a33] placeholder:text-[#c0b3a1] focus:border-[#d9c8b5] focus:outline-none focus:ring-2 focus:ring-[#f4d8c4]"
          />
        </div>
      </div>

      <div className="space-y-3">
        {threads.length === 0 ? (
          <div className="rounded-3xl border border-[#e7dfd4] bg-white p-12 text-center">
            <p className="text-sm text-[#a18a72]">No messages yet</p>
          </div>
        ) : (
          threads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              onClick={() => onThreadClick?.(thread.id)}
              className="flex w-full items-start gap-4 rounded-3xl border border-[#e7dfd4] bg-white px-6 py-5 text-left transition hover:border-[#f0bda4] hover:bg-[#fff2e8]"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {thread.unread && (
                      <span className="h-2 w-2 rounded-full bg-[#f0bda4]" aria-label="Unread" />
                    )}
                    <p className="text-sm font-semibold text-[#3f3a33]">
                      {thread.senderName}
                      {mode === "venue" && thread.senderType === "vendor" && (
                        <span className="ml-2 text-xs font-normal text-[#a18a72]">(Vendor)</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#a18a72]">{thread.timestamp}</span>
                    {thread.actionRequired && (
                      <span className="inline-flex items-center rounded-full bg-[#fde9e1] px-2 py-0.5 text-xs font-medium text-[#c96f3a]">
                        Action Required
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs font-medium text-[#6f6453]">
                  Re: {thread.eventName}
                  {thread.subject && ` • ${thread.subject}`}
                </p>
                <p className="line-clamp-2 text-sm text-[#a18a72]">{thread.preview}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
