'use client';

import { useState } from "react";

const HISTORY_ITEMS = [
  {
    id: "h1",
    title: "Menu refinements",
    summary: "Captured vegetarian requests and pricing update for Bella's Catering.",
    timestamp: "Yesterday • 4:36 PM",
  },
  {
    id: "h2",
    title: "Photography planning",
    summary: "Drafted shot list outline and shared vendor hand-off notes.",
    timestamp: "Oct 8 • 11:15 AM",
  },
  {
    id: "h3",
    title: "Decor vision",
    summary: "Logged floral palette inspiration and ceremony layout preferences.",
    timestamp: "Oct 6 • 6:05 PM",
  },
];

// Collapsible sidebar showing recent conversations, inspired by Claude's navigation.
export function ChatHistoryList() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <nav
      className={[
        "flex h-full min-h-screen shrink-0 flex-col border-r border-[#e7dfd4] bg-[#f6efe5] transition-[width] duration-200 ease-out",
        isCollapsed ? "w-[70px]" : "w-[260px]",
      ].join(" ")}
      aria-label="Recent conversations"
    >
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between px-4 py-5">
          {!isCollapsed ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b09c86]">White Glove</p>
              <p className="mt-1 text-sm font-semibold text-[#4d463b]">Client concierge</p>
            </div>
          ) : (
            <span className="text-sm font-semibold text-[#4d463b]">WG</span>
          )}
          <button
            type="button"
            aria-label={isCollapsed ? "Expand conversation sidebar" : "Collapse conversation sidebar"}
            onClick={() => setIsCollapsed((value) => !value)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#e7dfd4] text-[#a18a72] transition hover:bg-[#f1e9df]"
          >
            {isCollapsed ? "›" : "‹"}
          </button>
        </div>

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

        <div className="mt-6 flex-1 overflow-y-auto px-2 pb-6">
          {!isCollapsed && (
            <p className="px-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#b09c86]">Recents</p>
          )}
          <ul className="mt-3 space-y-1">
            {HISTORY_ITEMS.map((item) => (
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

      <div className="border-t border-[#e7dfd4] px-4 py-5">
        <button
          type="button"
          className={[
            "flex w-full items-center gap-3 rounded-2xl bg-[#f4d8c4] px-3 py-2 text-left text-sm font-semibold text-[#624230] transition hover:bg-[#f0c9b1]",
            isCollapsed ? "justify-center px-0" : "",
          ].join(" ")}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs text-[#624230]">J</span>
          {!isCollapsed ? <span>Jackson</span> : null}
        </button>
      </div>
    </nav>
  );
}
