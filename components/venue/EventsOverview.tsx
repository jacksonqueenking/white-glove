'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormSelect } from '../forms/FormSelect';
import { FormInput } from '../forms/FormInput';
import { useCurrentUser } from '../../lib/hooks/useCurrentUser';
import { listEvents } from '../../lib/db/events';
import { listSpaces } from '../../lib/db/spaces';
import { listTasks } from '../../lib/db/tasks';
import { createClient } from '../../lib/supabase/client';

interface EventSummary {
  event_id: string;
  name: string;
  date: string;
  space: string;
  status: 'needs_attention' | 'on_track' | 'completed';
  attention_items: string[];
}

export function EventsOverview() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventSummary[]>([]);
  const [filters, setFilters] = useState({
    status: 'all',
    timeRange: 'all',
    search: '',
  });

  useEffect(() => {
    if (!userLoading && user) {
      loadEvents();
    }
  }, [userLoading, user]);

  useEffect(() => {
    applyFilters();
  }, [events, filters]);

  async function loadEvents() {
    try {
      if (!user || user.type !== 'venue' || !user.venueId) {
        setLoading(false);
        return;
      }

      const supabase = createClient();

      // Load events, spaces, and tasks
      const [eventsData, spacesData, allTasks] = await Promise.all([
        listEvents(supabase, { venue_id: user.venueId }),
        listSpaces(supabase, user.venueId),
        // Get all tasks for this venue's events
        (async () => {
          // TODO: Create a function to get tasks by venue_id
          return [];
        })(),
      ]);

      // Create space mapping
      const spaceMap = Object.fromEntries(
        spacesData.map((s) => [s.space_id, s.name])
      );

      // Transform events
      const eventSummaries: EventSummary[] = eventsData.map((event) => {
        // Determine status based on event status
        let displayStatus: 'needs_attention' | 'on_track' | 'completed';
        if (event.status === 'completed') {
          displayStatus = 'completed';
        } else if (['inquiry', 'pending_confirmation'].includes(event.status)) {
          displayStatus = 'needs_attention';
        } else {
          displayStatus = 'on_track';
        }

        // Format date
        const eventDate = new Date(event.date);
        const dateStr = eventDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

        return {
          event_id: event.event_id,
          name: event.name,
          date: dateStr,
          space: spaceMap[event.venue_id] || 'Unknown Space',
          status: displayStatus,
          attention_items: [], // TODO: Get from tasks
        };
      });

      setEvents(eventSummaries);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...events];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter((event) => event.status === filters.status);
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.name.toLowerCase().includes(searchLower) ||
          event.space.toLowerCase().includes(searchLower)
      );
    }

    setFilteredEvents(filtered);
  }

  function getStatusIcon(status: EventSummary['status']) {
    switch (status) {
      case 'needs_attention':
        return '⚠️';
      case 'on_track':
        return '✓';
      case 'completed':
        return '🟢';
      default:
        return '○';
    }
  }

  function getStatusColor(status: EventSummary['status']) {
    switch (status) {
      case 'needs_attention':
        return 'border-red-200 bg-red-50';
      case 'on_track':
        return 'border-green-200 bg-green-50';
      case 'completed':
        return 'border-slate-200 bg-slate-50';
      default:
        return 'border-slate-200 bg-white';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="grid md:grid-cols-3 gap-4">
          <FormSelect
            label="Status"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            options={[
              { value: 'all', label: 'All Events' },
              { value: 'needs_attention', label: 'Needs Attention' },
              { value: 'on_track', label: 'On Track' },
              { value: 'completed', label: 'Completed' },
            ]}
          />

          <FormSelect
            label="Time Range"
            value={filters.timeRange}
            onChange={(e) => setFilters({ ...filters, timeRange: e.target.value })}
            options={[
              { value: 'all', label: 'All Time' },
              { value: 'this_week', label: 'This Week' },
              { value: 'this_month', label: 'This Month' },
              { value: 'next_3_months', label: 'Next 3 Months' },
            ]}
          />

          <FormInput
            label="Search"
            placeholder="Search events..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <p className="text-slate-600">No events found matching your filters.</p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.event_id}
              onClick={() => router.push(`/venue/events/${event.event_id}`)}
              className={`rounded-lg border-2 p-6 cursor-pointer hover:shadow-md transition-all ${getStatusColor(
                event.status
              )}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getStatusIcon(event.status)}</span>
                    <h3 className="text-lg font-semibold text-slate-900">{event.name}</h3>
                  </div>

                  <p className="text-sm text-slate-600 mb-3">
                    {event.date} • {event.space}
                  </p>

                  {event.attention_items.length > 0 ? (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">
                        {event.attention_items.length} items need attention:
                      </p>
                      <ul className="space-y-1">
                        {event.attention_items.map((item, index) => (
                          <li key={index} className="text-sm text-slate-600">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-green-700 font-medium">All items on track</p>
                  )}
                </div>

                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
