interface VenueEventPageProps {
  params: { eventId: string };
}

// Venue-facing event hub consolidating tasks, vendors, and messaging.
export default function VenueEventPage({ params }: VenueEventPageProps) {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Event Detail</h1>
        <p className="text-sm text-slate-600">Coordinating event {params.eventId}</p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-white p-4 md:col-span-2">
          <h2 className="text-lg font-medium">Timeline & Tasks</h2>
          <p className="text-sm text-slate-600">
            Display orchestrator-generated tasks, approvals, and deadlines per docs/tasks-and-workflows.md.
          </p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-medium">Vendor Coordination</h2>
          <p className="text-sm text-slate-600">
            Surface vendor status, outstanding questions, and certificate of insurance tracking per docs/schema.md.
          </p>
        </article>
      </div>
    </section>
  );
}
