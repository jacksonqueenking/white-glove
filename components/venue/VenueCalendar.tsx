'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../shared/Button';
import { useCurrentUser } from '../../lib/hooks/useCurrentUser';
import { getEventsByDateRange } from '../../lib/db/events';
import { listSpaces } from '../../lib/db/spaces';
import { createClient } from '../../lib/supabase/client';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  space: string;
  color: string;
}

const SPACE_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
];

export function VenueCalendar() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [spaceColorMap, setSpaceColorMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!userLoading && user) {
      loadEvents();
    }
  }, [currentDate, view, userLoading, user]);

  async function loadEvents() {
    try {
      if (!user || user.type !== 'venue' || !user.venueId) {
        setLoading(false);
        return;
      }

      const supabase = createClient();

      // Get date range for current month
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1).toISOString();
      const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      // Load events and spaces
      const [eventsData, spacesData] = await Promise.all([
        getEventsByDateRange(supabase, startDate, endDate, user.venueId),
        listSpaces(supabase, user.venueId),
      ]);

      // Create space color mapping
      const colorMap: Record<string, string> = {};
      spacesData.forEach((space, index) => {
        colorMap[space.space_id] = SPACE_COLORS[index % SPACE_COLORS.length];
      });
      setSpaceColorMap(colorMap);

      // Get space names for events
      const spaceMap = Object.fromEntries(
        spacesData.map((s) => [s.space_id, s.name])
      );

      // Transform events for calendar display
      const calendarEvents: CalendarEvent[] = eventsData.map((event) => ({
        id: event.event_id,
        title: event.name,
        date: new Date(event.date),
        space: spaceMap[event.venue_id] || 'Unknown Space',
        color: colorMap[event.venue_id] || '#64748b',
      }));

      setEvents(calendarEvents);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  }

  function getDaysInMonth(date: Date): Date[] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // Add days from previous month to fill the first week
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push(prevDate);
    }

    // Add days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    // Add days from next month to fill the last week
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  }

  function isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  function isSameMonth(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth()
    );
  }

  function previousMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  function handleEventClick(eventId: string) {
    router.push(`/venue/events/${eventId}`);
  }

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      {/* Calendar Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-slate-900">{monthName}</h2>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={previousMonth}>
              ←
            </Button>
            <Button variant="secondary" onClick={goToToday}>
              Today
            </Button>
            <Button variant="secondary" onClick={nextMonth}>
              →
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={view === 'month' ? 'primary' : 'secondary'}
            onClick={() => setView('month')}
          >
            Month
          </Button>
          <Button
            variant={view === 'week' ? 'primary' : 'secondary'}
            onClick={() => setView('week')}
            disabled
          >
            Week
          </Button>
          <Button
            variant={view === 'day' ? 'primary' : 'secondary'}
            onClick={() => setView('day')}
            disabled
          >
            Day
          </Button>
        </div>
      </div>

      {/* Month View */}
      {view === 'month' && (
        <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="bg-slate-50 py-2 text-center text-sm font-semibold text-slate-700"
            >
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {days.map((day, index) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const dayEvents = events.filter((event) => isSameDay(event.date, day));

            return (
              <div
                key={index}
                className={`bg-white min-h-[100px] p-2 ${
                  !isCurrentMonth ? 'opacity-40' : ''
                }`}
              >
                <div
                  className={`text-sm font-medium mb-1 ${
                    isToday
                      ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center'
                      : 'text-slate-700'
                  }`}
                >
                  {day.getDate()}
                </div>

                <div className="space-y-1">
                  {dayEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => handleEventClick(event.id)}
                      className="w-full text-left text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                      style={{ backgroundColor: `${event.color}20`, color: event.color }}
                    >
                      {event.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend & Upcoming Deadlines */}
      <div className="mt-6 grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Legend</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
              <span className="text-sm text-slate-700">Main Ballroom</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
              <span className="text-sm text-slate-700">Garden Terrace</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Upcoming Deadlines</h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• Contract due: Smith Wedding</li>
            <li>• Deposit due: Johnson Corp Event</li>
            <li>• Final headcount: Martinez Party</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
