interface GuestPageProps {
  params: { eventId: string };
}

// Guests management interface described in the client interface specification.
export default function ClientGuestsPage({ params }: GuestPageProps) {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Guests</h1>
        <p className="text-sm text-slate-600">Manage RSVPs for event {params.eventId}.</p>
      </header>
      <p className="text-sm text-slate-600">
        Implement table, bulk actions, CSV import, and filters per docs/frontend/client-interface.md.
      </p>
    </section>
  );
}
