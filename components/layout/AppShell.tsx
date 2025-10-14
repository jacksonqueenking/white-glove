'use client';

import type { ReactNode } from "react";
import { ChatHistoryList } from "../chat/ChatHistoryList";
import { useCurrentUser } from "../../lib/hooks/useCurrentUser";
import { useParams } from "next/navigation";

// Import ChatKit components
import { ClientEventChat } from "../chat/ClientEventChat";
import { VenueEventChat } from "../chat/VenueEventChat";
import { VenueGeneralChat } from "../chat/VenueGeneralChat";

interface AppShellProps {
  children: ReactNode;
  mode: "client" | "venue" | "vendor";
}

// Unified application shell with Claude-style navigation, anchored chat, and content pane.
export function AppShell({ children, mode }: AppShellProps) {
  const { user, loading } = useCurrentUser();
  const params = useParams();
  const eventId = params?.eventId as string | undefined;

  // Render appropriate chat component based on mode and context
  const renderChatComponent = () => {
    if (loading) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-[#8e806c]">
          Loading chat...
        </div>
      );
    }

    if (!user) {
      return (
        <div className="flex h-full items-center justify-center p-6 text-center text-sm text-[#8e806c]">
          Please log in to access chat
        </div>
      );
    }

    if (mode === "client" && user.type === "client") {
      if (eventId) {
        return <ClientEventChat clientId={user.clientId!} eventId={eventId} className="h-full" />;
      }
      return (
        <div className="flex h-full items-center justify-center p-6 text-center text-sm text-[#8e806c]">
          Select an event to chat with your assistant
        </div>
      );
    }

    if (mode === "venue" && user.type === "venue") {
      if (eventId) {
        return <VenueEventChat venueId={user.venueId!} eventId={eventId} className="h-full" />;
      }
      return <VenueGeneralChat venueId={user.venueId!} className="h-full" />;
    }

    // Fallback for vendors or other cases
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-[#8e806c]">
        Chat not available
      </div>
    );
  };

  return (
    <div className="app-shell fixed inset-0 flex bg-[#f8f4ec]">
      <ChatHistoryList />
      <section className="flex flex-1 min-w-0">
        <aside className="flex w-[420px] flex-col border-r border-[#e7dfd4] bg-[#f8f4ec]">
          {renderChatComponent()}
        </aside>
        <main className="flex-1 overflow-y-auto bg-[#fefbf5] px-12 py-12">{children}</main>
      </section>
    </div>
  );
}
