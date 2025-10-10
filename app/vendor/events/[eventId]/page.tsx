interface VendorEventPageProps {
  params: Promise<{ eventId: string }>;
}

// Vendor event detail page scoped to the vendor's services.
export default async function VendorEventPage({ params }: VendorEventPageProps) {
  const { eventId } = await params;

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Event Assignment</h1>
        <p className="text-sm text-slate-600">Event {eventId}</p>
      </header>
      <p className="text-sm text-slate-600">
        Summarize service specs, schedules, and outstanding action items per docs/frontend/vendor-interface.md.
      </p>
    </section>
  );
}
