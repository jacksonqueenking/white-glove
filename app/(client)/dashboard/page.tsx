// Placeholder dashboard that will list multiple events once a client has more than one booking.
export default function ClientDashboardPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Client Dashboard</h1>
      <p className="text-sm text-slate-600">
        Show an events list only when a client manages multiple events. Otherwise redirect users to their primary
        event per docs/frontend/client-interface.md.
      </p>
    </section>
  );
}
