import { EventsOverview } from "../../../components/venue/EventsOverview";

export default function VenueEventsPage() {
  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-slate-900">Events</h1>
        <p className="mt-2 text-sm text-slate-600">
          Overview of all events requiring attention and upcoming bookings.
        </p>
      </header>
      <EventsOverview />
    </section>
  );
}
