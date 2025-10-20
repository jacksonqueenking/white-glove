import { EventsOverview } from "../../../components/event/EventsOverview";

export default function ClientEventsPage() {
  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-slate-900">My Events</h1>
        <p className="mt-2 text-sm text-slate-600">
          View and manage your upcoming events and bookings.
        </p>
      </header>
      <EventsOverview userType="client" />
    </section>
  );
}
