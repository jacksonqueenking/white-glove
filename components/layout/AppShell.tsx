'use client';

import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useCurrentUser } from "../../lib/hooks/useCurrentUser";
import { useParams } from "next/navigation";

// Import ChatKit components
import { ClientEventChat } from "../chat/ClientEventChat";
import { VenueEventChat } from "../chat/VenueEventChat";
import { VenueGeneralChat } from "../chat/VenueGeneralChat";
import { ChatList } from "../chat/ChatList";

interface AppShellProps {
  children: ReactNode;
  mode: "client" | "venue" | "vendor";
}

// Unified application shell with navigation sidebar, optional chat panel, and content area.
export function AppShell({ children, mode }: AppShellProps) {
  const { user, loading } = useCurrentUser();
  const params = useParams();
  const eventId = params?.eventId as string | undefined;
  const chatId = params?.chatId as string | undefined;

  // Show chat panel on event detail pages (including chat routes)
  const showChatPanel = eventId !== undefined;

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

    if (mode === "client" && user.type === "client" && eventId && chatId) {
      return <ClientEventChat clientId={user.clientId!} eventId={eventId} chatId={chatId} className="h-full" />;
    }

    if (mode === "venue" && user.type === "venue" && eventId && chatId) {
      return <VenueEventChat venueId={user.venueId!} eventId={eventId} chatId={chatId} className="h-full" />;
    }

    return null;
  };

  return (
    <div className="app-shell fixed inset-0 flex bg-[#f8f4ec]">
      <Sidebar />
      <section className="flex flex-1 min-w-0">
        {showChatPanel && (
          <>
            {/* Chat list sidebar */}
            <aside className="flex w-[240px] flex-col border-r border-[#e7dfd4] bg-[#f8f4ec]">
              <ChatList eventId={eventId!} mode={mode as 'client' | 'venue'} />
            </aside>
            {/* Chat panel */}
            <aside className="flex w-[420px] flex-col border-r border-[#e7dfd4] bg-[#f8f4ec]">
              {renderChatComponent()}
            </aside>
          </>
        )}
        <main className="flex-1 overflow-y-auto bg-[#fefbf5] px-12 py-12">{children}</main>
      </section>
    </div>
  );
}
