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

export interface EventTask {
  id: string;
  title: string;
  due: string;
  status: "upcoming" | "waiting" | "complete";
}

export interface CalendarItem {
  id: string;
  date: string;
  time?: string;
  label: string;
  description: string;
}

interface EventSummary {
  id: string;
  name: string;
  venue: string;
  date: string;
  time: string;
  guestCount: number;
  planner: string;
  summary: string;
}

interface EventDetailPanelProps {
  event: EventSummary;
  elements: EventElement[];
  tasks: EventTask[];
  calendar: CalendarItem[];
}

const STATUS_TOKENS: Record<ElementStatus, { label: string; badge: string }> = {
  todo: { label: "To do", badge: "bg-[#fde9e1] text-[#c96f3a]" },
  in_progress: { label: "In progress", badge: "bg-[#f6e7d0] text-[#a87b3b]" },
  completed: { label: "Complete", badge: "bg-[#e4f1e6] text-[#3c8650]" },
  attention: { label: "Needs attention", badge: "bg-[#fbe4d4] text-[#b16455]" },
};

const TASK_TOKENS: Record<EventTask["status"], { label: string; badge: string }> = {
  upcoming: { label: "Scheduled", badge: "bg-[#f6e7d0] text-[#a87b3b]" },
  waiting: { label: "Awaiting reply", badge: "bg-[#fbe4d4] text-[#b16455]" },
  complete: { label: "Completed", badge: "bg-[#e4f1e6] text-[#3c8650]" },
};

type PanelView = "tasks" | "elements" | "calendar" | "element-detail";

const VIEW_TABS: Array<{ id: Exclude<PanelView, "element-detail">; label: string }> = [
  { id: "tasks", label: "Tasks" },
  { id: "elements", label: "Elements" },
  { id: "calendar", label: "Calendar" },
];

// Single large planning panel with segmented views and element deep-dive.
export function EventDetailPanel({ event, elements, tasks, calendar }: EventDetailPanelProps) {
  const [view, setView] = useState<PanelView>("elements");
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  const activeElement = useMemo(
    () => elements.find((element) => element.id === selectedElement) ?? null,
    [elements, selectedElement],
  );

  const statusSummary = useMemo(
    () =>
      elements.reduce(
        (acc, element) => {
          acc[element.status] += 1;
          return acc;
        },
        { todo: 0, in_progress: 0, completed: 0, attention: 0 },
      ),
    [elements],
  );

  const resolvedView = view === "element-detail" && !activeElement ? "elements" : view;

  const handleSelectElement = (elementId: string) => {
    setSelectedElement(elementId);
    setView("element-detail");
  };

  const handleBackToElements = () => {
    setView("elements");
    setSelectedElement(null);
  };

  return (
    <section className="flex flex-col rounded-[32px] border border-[#e7dfd4] bg-[#fff8ee] shadow-sm">
      <header className="px-10 pb-8 pt-9">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b09c86]">Event</p>
            <h1 className="text-3xl font-semibold text-[#3f3a33]">{event.name}</h1>
            <p className="text-sm text-[#6f6453]">
              Coordinated by {event.planner} • Guest count: {event.guestCount}
            </p>
          </div>
          <div className="rounded-3xl border border-[#eadfce] bg-[#fdf5ec] px-6 py-4 text-sm text-[#6f6453]">
            <p className="flex items-center gap-2 font-medium text-[#4d463b]">
              <span aria-hidden>📍</span>
              {event.venue}
            </p>
            <p className="mt-2 flex items-center gap-2">
              <span aria-hidden>📅</span>
              {event.date}
            </p>
            <p className="mt-1 flex items-center gap-2">
              <span aria-hidden>⏰</span>
              {event.time}
            </p>
          </div>
        </div>
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-[#6f6453]">{event.summary}</p>
        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-[#b09c86]">Event ID • {event.id}</p>
      </header>

      <div className="border-t border-[#e7dfd4] px-10 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex rounded-full bg-[#fef1e4] p-1">
            {VIEW_TABS.map((tab) => {
              const isActive =
                tab.id === "elements" ? resolvedView === "elements" || resolvedView === "element-detail" : resolvedView === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setView(tab.id);
                    if (tab.id !== "elements") {
                      setSelectedElement(null);
                    }
                  }}
                  className={[
                    "rounded-full px-5 py-2 text-sm font-medium transition",
                    isActive ? "bg-white text-[#3f3a33] shadow" : "text-[#a18a72] hover:text-[#7d6a55]",
                  ].join(" ")}
                  aria-pressed={isActive}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] uppercase tracking-[0.18em] text-[#b09c86] sm:grid-cols-4">
            <div className="flex flex-col text-right">
              <dt>Completed</dt>
              <dd className="text-sm font-semibold text-[#3f3a33]">{statusSummary.completed}</dd>
            </div>
            <div className="flex flex-col text-right">
              <dt>In progress</dt>
              <dd className="text-sm font-semibold text-[#3f3a33]">{statusSummary.in_progress}</dd>
            </div>
            <div className="flex flex-col text-right">
              <dt>Needs attention</dt>
              <dd className="text-sm font-semibold text-[#3f3a33]">{statusSummary.attention}</dd>
            </div>
            <div className="flex flex-col text-right">
              <dt>To do</dt>
              <dd className="text-sm font-semibold text-[#3f3a33]">{statusSummary.todo}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="flex-1 border-t border-[#e7dfd4] px-10 py-8">
        {resolvedView === "elements" ? (
          <section className="space-y-5">
            <header className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#4d463b]">Elements</h2>
              <span className="text-xs text-[#a18a72]">Status at a glance</span>
            </header>
            <ul className="space-y-3">
              {elements.map((element) => {
                const token = STATUS_TOKENS[element.status];

                return (
                  <li key={element.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectElement(element.id)}
                      className={[
                        "flex w-full items-center justify-between rounded-[26px] border px-5 py-4 text-left transition",
                        selectedElement === element.id && view === "element-detail"
                          ? "border-[#f0bda4] bg-[#fff2e8] shadow-sm"
                          : "border-transparent bg-[#fdf8f1] hover:border-[#f0bda4] hover:bg-[#fff2e8]",
                      ].join(" ")}
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#3f3a33]">{element.name}</p>
                        <p className="mt-1 text-xs text-[#a18a72]">{element.vendor}</p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${token.badge}`}
                      >
                        {token.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {resolvedView === "element-detail" && activeElement ? (
          <article className="flex h-full flex-col gap-8 text-sm leading-relaxed text-[#6f6453]">
            <div>
              <button
                type="button"
                onClick={handleBackToElements}
                className="inline-flex items-center gap-2 rounded-full border border-[#e7dfd4] px-4 py-2 text-xs font-medium text-[#6f6453] transition hover:bg-[#f1e9df]"
              >
                ← Back to elements
              </button>
              <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b09c86]">
                Focused element
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[#3f3a33]">{activeElement.name}</h2>
              <p className="mt-2">{activeElement.description}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
              <div className="rounded-3xl border border-[#f0bda4] bg-[#fff2e8] px-6 py-5">
                <p className="font-semibold text-[#4d463b]">Current estimate</p>
                <p className="mt-2 text-3xl font-bold text-[#3f3a33]">{activeElement.price}</p>
                <p className="mt-2 text-xs text-[#a18a72]">Provided by {activeElement.vendor}</p>
              </div>
              <p className="rounded-3xl bg-[#fff2e8] px-6 py-5 text-xs text-[#b16455]">Notes: {activeElement.notes}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {activeElement.actions.map((action) => (
                <button
                  key={action}
                  type="button"
                  className="inline-flex items-center justify-center rounded-full border border-[#e7dfd4] px-5 py-2 text-sm font-medium text-[#6f6453] transition hover:bg-[#f1e9df]"
                >
                  {action}
                </button>
              ))}
            </div>
          </article>
        ) : null}

        {resolvedView === "tasks" ? (
          <section className="space-y-5">
            <header>
              <h2 className="text-sm font-semibold text-[#4d463b]">Tasks</h2>
              <p className="mt-1 text-xs text-[#a18a72]">Tracked automatically from your conversations.</p>
            </header>
            <ul className="space-y-3">
              {tasks.map((task) => {
                const token = TASK_TOKENS[task.status];

                return (
                  <li key={task.id} className="rounded-[26px] border border-[#e7dfd4] bg-white px-5 py-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#3f3a33]">{task.title}</p>
                        <p className="mt-1 text-xs text-[#a18a72]">{task.due}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${token.badge}`}>
                        {token.label}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {resolvedView === "calendar" ? (
          <section className="space-y-5">
            <header>
              <h2 className="text-sm font-semibold text-[#4d463b]">Calendar</h2>
              <p className="mt-1 text-xs text-[#a18a72]">Key milestones coming up this month.</p>
            </header>
            <ul className="space-y-4">
              {calendar.map((item) => (
                <li key={item.id} className="flex items-start gap-4 rounded-[26px] border border-[#e7dfd4] bg-white px-5 py-4">
                  <div className="rounded-2xl bg-[#fff2e8] px-3 py-2 text-center text-xs font-semibold text-[#b16455]">
                    <p>{item.date}</p>
                    {item.time ? <p className="mt-1 text-[11px] font-medium text-[#a18a72]">{item.time}</p> : null}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#3f3a33]">{item.label}</p>
                    <p className="mt-1 text-xs text-[#6f6453]">{item.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </section>
  );
}
