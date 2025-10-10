interface GuestPageProps {
  params: Promise<{ eventId: string }>;
}

// Guests management interface described in the client interface specification.
export default async function ClientGuestsPage({ params }: GuestPageProps) {
  const { eventId } = await params;

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Guests</h1>
        <p className="text-sm text-slate-600">Manage RSVPs for event {eventId}.</p>
      </header>
      <p className="text-sm text-slate-600">
        Implement table, bulk actions, CSV import, and filters per docs/frontend/client-interface.md.
      </p>
    </section>
  );
}
