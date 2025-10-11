import type { ReactNode } from "react";

import { ChatHistoryList } from "../../components/chat/ChatHistoryList";
import { ChatWindow } from "../../components/chat/ChatWindow";

// Client persona layout with Claude-style navigation, anchored chat, and event detail pane.
export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="client-shell fixed inset-0 flex bg-[#f8f4ec]">
      <ChatHistoryList />
      <section className="flex flex-1 min-w-0">
        <aside className="flex w-[420px] flex-col border-r border-[#e7dfd4] bg-[#f8f4ec]">
          <ChatWindow />
        </aside>
        <main className="flex-1 overflow-y-auto bg-[#fefbf5] px-12 py-12">{children}</main>
      </section>
    </div>
  );
}
