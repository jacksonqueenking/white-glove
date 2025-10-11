import type { ReactNode } from "react";

import { ChatHistoryList } from "../../components/chat/ChatHistoryList";
import { ChatWindow } from "../../components/chat/ChatWindow";

// Client persona layout with split-screen chat and detail panel placeholders.
export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="client-shell grid min-h-screen grid-cols-[440px_minmax(0,1fr)] bg-[#f8f4ec]">
      <aside className="flex flex-col gap-6 border-r border-[#e7dfd4] px-8 py-10">
        <div className="flex-1">
          <ChatWindow />
        </div>
        <ChatHistoryList />
      </aside>
      <main className="overflow-y-auto px-12 py-12">{children}</main>
    </div>
  );
}
