// Landing page for the client workspace.
export default function ClientHomePage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Client Workspace</h1>
      <p className="text-sm text-slate-600">
        Direct clients to `/client/event/[eventId]` when they have an active booking. Otherwise show onboarding or event selection.
      </p>
    </section>
  );
}
