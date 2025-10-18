'use client';

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "../../lib/hooks/useCurrentUser";
import { UserMenu } from "./UserMenu";

const VENUE_NAV_ITEMS = [
  { id: "profile", label: "Profile", href: "/venue/profile", icon: "⚙️" },
  { id: "spaces", label: "Spaces", href: "/venue/spaces", icon: "🏛️" },
  { id: "events", label: "Events", href: "/venue/events", icon: "🎉" },
  { id: "messages", label: "Messages", href: "/venue/messages", icon: "💬" },
  { id: "tasks", label: "Tasks", href: "/venue/tasks", icon: "✓" },
  { id: "vendors", label: "Vendors", href: "/venue/vendors", icon: "🤝" },
  { id: "offerings", label: "Offerings", href: "/venue/offerings", icon: "📦" },
];

const CLIENT_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/client/dashboard", icon: "🏠" },
  { id: "events", label: "My Events", href: "/client/events", icon: "🎉" },
  { id: "messages", label: "Messages", href: "/client/messages", icon: "💬" },
  { id: "tasks", label: "Tasks", href: "/client/tasks", icon: "✓" },
];

const RECENT_CHATS = [
  {
    id: "h1",
    title: "Menu refinements",
    timestamp: "Yesterday • 4:36 PM",
  },
  {
    id: "h2",
    title: "Photography planning",
    timestamp: "Oct 8 • 11:15 AM",
  },
  {
    id: "h3",
    title: "Decor vision",
    timestamp: "Oct 6 • 6:05 PM",
  },
];

// Main application sidebar with navigation and recent chats.
export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, loading } = useCurrentUser();

  const isVenuePath = pathname?.startsWith('/venue');
  const isClientPath = pathname?.startsWith('/client');

  let navItems: typeof VENUE_NAV_ITEMS = [];
  let portalLabel = "Portal";

  // Show navigation based on path, even if user is still loading
  if (isVenuePath) {
    navItems = VENUE_NAV_ITEMS;
    portalLabel = "Venue Portal";
  } else if (isClientPath) {
    navItems = CLIENT_NAV_ITEMS;
    portalLabel = "Client Portal";
  }

  const userName = user?.email?.split('@')[0] || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <nav
      className={[
        "flex h-full shrink-0 flex-col border-r border-[#e7dfd4] bg-[#f6efe5] transition-[width] duration-200 ease-out",
        isCollapsed ? "w-[70px]" : "w-[260px]",
      ].join(" ")}
      aria-label="Main navigation"
    >
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-5">
          {!isCollapsed ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b09c86]">White Glove</p>
              <p className="mt-1 text-sm font-semibold text-[#4d463b]">{portalLabel}</p>
            </div>
          ) : (
            <span className="text-sm font-semibold text-[#4d463b]">WG</span>
          )}
          <button
            type="button"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setIsCollapsed((value) => !value)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#e7dfd4] text-[#a18a72] transition hover:bg-[#f1e9df]"
          >
            {isCollapsed ? "›" : "‹"}
          </button>
        </div>

        {/* Navigation */}
        {navItems.length > 0 ? (
          <div className="px-2 pb-4">
            {!isCollapsed && (
              <p className="px-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#b09c86] mb-2">
                Navigation
              </p>
            )}
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={[
                        "flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition text-sm",
                        isActive
                          ? "bg-[#f0bda4] text-[#624230] font-semibold"
                          : "text-[#4d463b] hover:bg-[#f1e9df]",
                        isCollapsed ? "justify-center" : "",
                      ].join(" ")}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <span className="text-base">{item.icon}</span>
                      {!isCollapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="px-3">
            <button
              type="button"
              className={[
                "flex w-full items-center justify-center rounded-full bg-[#f0bda4] px-3 py-2 text-sm font-semibold text-[#624230] transition hover:bg-[#eba98a]",
                isCollapsed ? "aspect-square px-0" : "",
              ].join(" ")}
            >
              {isCollapsed ? "+" : "New chat"}
            </button>
          </div>
        )}

        {/* Recent Chats */}
        <div className="mt-6 flex-1 overflow-y-auto px-2 pb-6">
          {!isCollapsed && (
            <p className="px-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#b09c86]">
              Recent Chats
            </p>
          )}
          <ul className="mt-3 space-y-1">
            {RECENT_CHATS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={[
                    "group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition",
                    "hover:bg-[#f1e9df]",
                  ].join(" ")}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f4d8c4] text-xs font-semibold text-[#744930]">
                    {item.title.substring(0, 2).toUpperCase()}
                  </span>
                  {!isCollapsed ? (
                    <span className="flex flex-col">
                      <span className="text-sm font-medium text-[#3f3a33]">{item.title}</span>
                      <span className="text-[11px] text-[#a18a72]">{item.timestamp}</span>
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* User Profile */}
      <div className="border-t border-[#e7dfd4] px-4 py-5">
        <UserMenu
          userName={userName}
          userInitial={userInitial}
          userEmail={user?.email || ''}
          isCollapsed={isCollapsed}
        />
      </div>
    </nav>
  );
}
