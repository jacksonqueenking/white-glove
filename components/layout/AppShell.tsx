import type { ReactNode } from "react";
import { ChatHistoryList } from "../chat/ChatHistoryList";
import { ChatWindow } from "../chat/ChatWindow";
import { VenueChatWindow } from "../venue/VenueChatWindow";

interface AppShellProps {
  children: ReactNode;
  mode: "client" | "venue" | "vendor";
}

// Unified application shell with Claude-style navigation, anchored chat, and content pane.
export function AppShell({ children, mode }: AppShellProps) {
  const ChatComponent = mode === "venue" ? VenueChatWindow : ChatWindow;

  return (
    <div className="app-shell fixed inset-0 flex bg-[#f8f4ec]">
      <ChatHistoryList />
      <section className="flex flex-1 min-w-0">
        <aside className="flex w-[420px] flex-col border-r border-[#e7dfd4] bg-[#f8f4ec]">
          <ChatComponent />
        </aside>
        <main className="flex-1 overflow-y-auto bg-[#fefbf5] px-12 py-12">{children}</main>
      </section>
    </div>
  );
}
