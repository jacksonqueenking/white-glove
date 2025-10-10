import type { ReactNode } from "react";

import { ChatHistoryList } from "../../components/chat/ChatHistoryList";
import { ChatWindow } from "../../components/chat/ChatWindow";

// Client persona layout with split-screen chat and detail panel placeholders.
export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="client-shell grid min-h-screen grid-cols-[420px_1fr] bg-slate-100">
      <aside className="flex flex-col gap-6 border-r border-slate-200 bg-slate-50 p-6">
        <div className="flex-1">
          <ChatWindow />
        </div>
        <ChatHistoryList />
      </aside>
      <main className="overflow-y-auto bg-slate-50 p-8">{children}</main>
    </div>
  );
}
