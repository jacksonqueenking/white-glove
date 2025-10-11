'use client';

import { useMemo, useState } from "react";

type ElementStatus = "todo" | "in_progress" | "completed" | "attention";

export interface EventElement {
  id: string;
  name: string;
  status: ElementStatus;
  price: string;
  vendor: string;
  description: string;
  notes: string;
  actions: string[];
}

interface EventDetailPanelProps {
  elements: EventElement[];
  nextActions: string[];
}

const STATUS_TOKENS: Record<ElementStatus, { label: string; badge: string }> = {
  todo: { label: "To do", badge: "bg-[#f7e3dc] text-[#b16455]" },
  in_progress: { label: "In progress", badge: "bg-[#f4e7ce] text-[#a87b3b]" },
  completed: { label: "Complete", badge: "bg-[#e4f1e6] text-[#3c8650]" },
  attention: { label: "Needs attention", badge: "bg-[#fae5d4] text-[#c96f3a]" },
};

type PanelTab = "elements" | "next-actions";

const TABS: Array<{ id: PanelTab; label: string }> = [
  { id: "elements", label: "Elements" },
  { id: "next-actions", label: "Next actions" },
];

// Claude-style singular detail card with tabbed content and element deep-dive view.
export function EventDetailPanel({ elements, nextActions }: EventDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>("elements");
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  const activeElement = useMemo(
    () => elements.find((element) => element.id === selectedElement) ?? null,
    [elements, selectedElement],
  );

  return (
    <section className="glass-card flex min-h-[540px] flex-col px-8 py-7">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-[#fef5ef] p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedElement(null);
              }}
              className={[
                "rounded-full px-4 py-2 text-sm font-medium transition",
                activeTab === tab.id
                  ? "bg-white text-[#3f3a33] shadow"
                  : "text-[#a18a72] hover:text-[#7d6a55]",
              ].join(" ")}
              aria-pressed={activeTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "elements" && activeElement ? (
          <button
            type="button"
            onClick={() => setSelectedElement(null)}
            className="inline-flex items-center gap-2 rounded-full border border-[#e7dfd4] px-4 py-2 text-sm font-medium text-[#6f6453] transition hover:bg-[#f1e9df]"
          >
            ← Back to elements
          </button>
        ) : null}
      </header>

      <div className="mt-6 flex-1">
        {activeTab === "elements" ? (
          activeElement ? (
            <article className="flex h-full flex-col justify-between gap-6 text-sm leading-relaxed text-[#6f6453]">
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b09c86]">Focused element</p>
                  <h2 className="mt-2 text-2xl font-semibold text-[#3f3a33]">{activeElement.name}</h2>
                  <p className="mt-2">{activeElement.description}</p>
                </div>
                <div className="rounded-2xl border border-[#f0bda4] bg-[#fef5ef] px-5 py-4 text-sm text-[#6f6453]">
                  <p className="font-semibold text-[#4d463b]">Current estimate</p>
                  <p className="mt-1 text-2xl font-bold text-[#3f3a33]">{activeElement.price}</p>
                  <p className="mt-2 text-xs text-[#a18a72]">Provided by {activeElement.vendor}</p>
                </div>
                <p className="rounded-2xl bg-[#fef5ef] px-4 py-3 text-xs text-[#b16455]">Notes: {activeElement.notes}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                {activeElement.actions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    className="inline-flex items-center justify-center rounded-full border border-[#e7dfd4] px-4 py-2 text-sm font-medium text-[#6f6453] transition hover:bg-[#f1e9df]"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </article>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {elements.map((element) => {
                const token = STATUS_TOKENS[element.status];

                return (
                  <button
                    key={element.id}
                    type="button"
                    onClick={() => setSelectedElement(element.id)}
                    className="flex flex-col gap-1 rounded-3xl border border-transparent bg-[#fdf8f1] px-5 py-5 text-left transition hover:border-[#f0bda4] hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#3f3a33]">{element.name}</p>
                        <p className="mt-1 text-xs text-[#a18a72]">{element.vendor}</p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${token.badge}`}
                      >
                        {token.label}
                      </span>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-[#6f6453]">{element.description}</p>
                  </button>
                );
              })}
            </div>
          )
        ) : null}

        {activeTab === "next-actions" ? (
          <article className="text-sm leading-relaxed text-[#6f6453]">
            <h3 className="text-sm font-semibold text-[#4d463b]">Coming up next</h3>
            <ul className="mt-4 space-y-3 text-xs">
              {nextActions.map((action, index) => (
                <li key={action} className="flex gap-2">
                  <span className="mt-0.5 text-[#f0bda4]">{index + 1}.</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </article>
        ) : null}
      </div>
    </section>
  );
}
