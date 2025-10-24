'use client';

import { useMemo, useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getEvent } from "@/lib/db/events";
import { listEventElements } from "@/lib/db/event_elements";
import { listTasks } from "@/lib/db/tasks";
import { getGuestStats } from "@/lib/db/guests";
import { getVenue } from "@/lib/db/venues";
import { getClient } from "@/lib/db/clients";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";

type ElementStatus = "todo" | "in_progress" | "completed" | "attention";

export interface EventElement {
  id: string;
  name: string;
  status: ElementStatus;
  price: string;
  vendor: string;
  vendorId?: string;
  description: string;
  notes: string;
  internalNotes?: string;
  files?: Array<{ id: string; name: string; url: string }>;
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
  venue?: string;
  clientName?: string;
  date: string;
  time: string;
  guestCount: number;
  planner?: string;
  budget?: string;
  spaces?: string[];
  summary: string;
}

interface EventDetailPanelRealtimeProps {
  eventId: string;
  mode?: "client" | "venue";
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

function mapElementStatus(dbStatus: string): ElementStatus {
  const statusMap: Record<string, ElementStatus> = {
    'to-do': 'todo',
    'todo': 'todo',
    'in-progress': 'in_progress',
    'in_progress': 'in_progress',
    'completed': 'completed',
    'needs-attention': 'attention',
    'needs_attention': 'attention',
    'attention': 'attention',
  };
  return statusMap[dbStatus] || 'todo';
}

function mapTaskStatus(dbStatus: string): EventTask["status"] {
  if (dbStatus === 'completed') return 'complete';
  if (dbStatus === 'in_progress' || dbStatus === 'waiting_for_response') return 'waiting';
  return 'upcoming';
}

export function EventDetailPanelRealtime({
  eventId,
  mode = "client",
}: EventDetailPanelRealtimeProps) {
  const [view, setView] = useState<PanelView>("elements");
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [elements, setElements] = useState<EventElement[]>([]);
  const [tasks, setTasks] = useState<EventTask[]>([]);
  const [calendar, setCalendar] = useState<CalendarItem[]>([]);

  const supabase = createClient();

  const fetchEventData = useCallback(async () => {
    try {
      setIsLoading(true);
      const eventData = await getEvent(supabase, eventId);
      if (!eventData) {
        toast.error("Event not found");
        return;
      }

      let displayName = "Not assigned";
      if (mode === "client" && eventData.venue_id) {
        const venue = await getVenue(supabase, eventData.venue_id);
        if (venue) displayName = venue.name;
      } else if (mode === "venue" && eventData.client_id) {
        const client = await getClient(supabase, eventData.client_id);
        if (client) displayName = client.name;
      }

      const eventDate = new Date(eventData.date);
      const formattedDate = eventDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
      const formattedTime = eventDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      const guestStats = await getGuestStats(supabase, eventId);
      const eventSummary: EventSummary = {
        id: eventData.event_id,
        name: eventData.name,
        ...(mode === "client" ? { venue: displayName } : { clientName: displayName }),
        date: formattedDate,
        time: formattedTime,
        guestCount: guestStats.expected_attendance,
        summary: eventData.description || "No description provided",
      };
      setEvent(eventSummary);

      const elementsData = await listEventElements(supabase, eventId);
      const transformedElements: EventElement[] = elementsData.map((ee: any) => ({
        id: ee.event_element_id,
        name: ee.elements?.name || "Unknown Element",
        status: mapElementStatus(ee.status),
        price: ee.amount ? `$${ee.amount.toLocaleString()}` : "TBD",
        vendor: ee.elements?.vendor_name || "Unknown Vendor",
        vendorId: ee.elements?.vendor_id,
        description: ee.elements?.description || "",
        notes: ee.customization || "",
        internalNotes: ee.internal_notes || "",
        files: [],
        actions: [],
      }));
      setElements(transformedElements);

      const tasksData = await listTasks(supabase, { event_id: eventId });
      const transformedTasks: EventTask[] = tasksData.map((task: any) => ({
        id: task.task_id,
        title: task.name,
        due: task.due_date ? new Date(task.due_date).toLocaleDateString() : "No due date",
        status: mapTaskStatus(task.status),
      }));
      setTasks(transformedTasks);
      setCalendar([]);
    } catch (error) {
      console.error("Error fetching event data:", error);
      toast.error("Failed to load event data");
    } finally {
      setIsLoading(false);
    }
  }, [eventId, mode, supabase]);

  useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupRealtimeSubscriptions = async () => {
      channel = supabase.channel(`event-${eventId}`);

      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'events',
        filter: `event_id=eq.${eventId}`,
      }, async (payload) => {
        console.log('Event updated:', payload);
        if (payload.eventType === 'UPDATE' && payload.new) {
          toast.info("Event details updated");
          await fetchEventData();
        }
      });

      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'event_elements',
        filter: `event_id=eq.${eventId}`,
      }, async (payload) => {
        console.log('Event element changed:', payload);
        if (payload.eventType === 'INSERT') {
          toast.success("Element added");
        } else if (payload.eventType === 'UPDATE') {
          toast.info("Element updated");
        } else if (payload.eventType === 'DELETE') {
          toast.info("Element removed");
        }
        const elementsData = await listEventElements(supabase, eventId);
        const transformedElements: EventElement[] = elementsData.map((ee: any) => ({
          id: ee.event_element_id,
          name: ee.elements?.name || "Unknown Element",
          status: mapElementStatus(ee.status),
          price: ee.amount ? `$${ee.amount.toLocaleString()}` : "TBD",
          vendor: ee.elements?.vendor_name || "Unknown Vendor",
          vendorId: ee.elements?.vendor_id,
          description: ee.elements?.description || "",
          notes: ee.customization || "",
          internalNotes: ee.internal_notes || "",
          files: [],
          actions: [],
        }));
        setElements(transformedElements);
      });

      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `event_id=eq.${eventId}`,
      }, async (payload) => {
        console.log('Task changed:', payload);
        if (payload.eventType === 'INSERT') {
          toast.success("New task created");
        } else if (payload.eventType === 'UPDATE') {
          toast.info("Task updated");
        }
        const tasksData = await listTasks(supabase, { event_id: eventId });
        const transformedTasks: EventTask[] = tasksData.map((task: any) => ({
          id: task.task_id,
          title: task.name,
          due: task.due_date ? new Date(task.due_date).toLocaleDateString() : "No due date",
          status: mapTaskStatus(task.status),
        }));
        setTasks(transformedTasks);
      });

      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'guests',
        filter: `event_id=eq.${eventId}`,
      }, async (payload) => {
        console.log('Guest changed:', payload);
        if (payload.eventType === 'INSERT') {
          toast.success("Guest added");
        } else if (payload.eventType === 'UPDATE') {
          toast.info("Guest updated");
        } else if (payload.eventType === 'DELETE') {
          toast.info("Guest removed");
        }
        const guestStats = await getGuestStats(supabase, eventId);
        setEvent(prev => prev ? { ...prev, guestCount: guestStats.expected_attendance } : null);
      });

      channel.subscribe((status) => {
        console.log('Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to event updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to event updates');
          toast.error("Real-time updates unavailable");
        }
      });
    };

    setupRealtimeSubscriptions();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        console.log('Unsubscribed from event updates');
      }
    };
  }, [eventId, supabase, fetchEventData]);

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
    setIsEditing(false);
  };

  const handleBackToElements = () => {
    setView("elements");
    setSelectedElement(null);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <section className="flex flex-col rounded-[32px] border border-[#e7dfd4] bg-[#fff8ee] shadow-sm min-h-[600px] items-center justify-center">
        <p className="text-[#b09c86] text-sm">Loading event details...</p>
      </section>
    );
  }

  if (!event) {
    return (
      <section className="flex flex-col rounded-[32px] border border-[#e7dfd4] bg-[#fff8ee] shadow-sm min-h-[600px] items-center justify-center">
        <p className="text-[#b09c86] text-sm">Event not found</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col rounded-[32px] border border-[#e7dfd4] bg-[#fff8ee] shadow-sm">
      <header className="px-10 pb-8 pt-9">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b09c86]">Event</p>
            <h1 className="text-3xl font-semibold text-[#3f3a33]">{event.name}</h1>
            <p className="text-sm text-[#6f6453]">
              {mode === "client" && event.planner ? `Coordinated by ${event.planner} • ` : ""}
              {mode === "venue" && event.clientName ? `Client: ${event.clientName} • ` : ""}
              Guest count: {event.guestCount}
              {mode === "venue" && event.budget ? ` • Budget: ${event.budget}` : ""}
            </p>
          </div>
          <div className="rounded-3xl border border-[#eadfce] bg-[#fdf5ec] px-6 py-4 text-sm text-[#6f6453]">
            <p className="flex items-center gap-2 font-medium text-[#4d463b]">
              <span aria-hidden>📍</span>
              {mode === "client" ? event.venue : event.spaces?.join(", ")}
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
            {elements.length === 0 ? (
              <p className="text-sm text-[#a18a72] text-center py-8">No elements added yet</p>
            ) : (
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
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${token.badge}`}>
                          {token.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
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
              <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b09c86]">Focused element</p>
              <h2 className="mt-3 text-2xl font-semibold text-[#3f3a33]">{activeElement.name}</h2>
              {!isEditing && <p className="mt-2">{activeElement.description}</p>}
            </div>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
              <div className="rounded-3xl border border-[#f0bda4] bg-[#fff2e8] px-6 py-5">
                <p className="font-semibold text-[#4d463b]">Current estimate</p>
                <p className="mt-2 text-3xl font-bold text-[#3f3a33]">{activeElement.price}</p>
                <p className="mt-2 text-xs text-[#a18a72]">Provided by {activeElement.vendor}</p>
              </div>
              <div className="space-y-3">
                <div className="rounded-3xl bg-[#fff2e8] px-6 py-5 text-xs">
                  <p className="font-semibold text-[#4d463b]">Client Notes</p>
                  <p className="mt-2 text-[#6f6453]">{activeElement.notes || "None"}</p>
                </div>
                {mode === "venue" && activeElement.internalNotes && (
                  <div className="rounded-3xl bg-[#fdf8f1] px-6 py-5 text-xs">
                    <p className="font-semibold text-[#4d463b]">Internal Notes</p>
                    <p className="mt-2 text-[#6f6453]">{activeElement.internalNotes}</p>
                  </div>
                )}
              </div>
            </div>
          </article>
        ) : null}

        {resolvedView === "tasks" ? (
          <section className="space-y-5">
            <header>
              <h2 className="text-sm font-semibold text-[#4d463b]">Tasks</h2>
              <p className="mt-1 text-xs text-[#a18a72]">Tracked automatically from your conversations.</p>
            </header>
            {tasks.length === 0 ? (
              <p className="text-sm text-[#a18a72] text-center py-8">No tasks yet</p>
            ) : (
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
            )}
          </section>
        ) : null}

        {resolvedView === "calendar" ? (
          <section className="space-y-5">
            <header>
              <h2 className="text-sm font-semibold text-[#4d463b]">Calendar</h2>
              <p className="mt-1 text-xs text-[#a18a72]">Key milestones coming up this month.</p>
            </header>
            {calendar.length === 0 ? (
              <p className="text-sm text-[#a18a72] text-center py-8">No calendar items yet</p>
            ) : (
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
            )}
          </section>
        ) : null}
      </div>
    </section>
  );
}
