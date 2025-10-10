interface ClientEventPageProps {
  params: Promise<{ eventId: string }>;
}

// Split-screen event planning UI tied to the AI assistant conversation.
export default async function ClientEventPage({ params }: ClientEventPageProps) {
  const { eventId } = await params;

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Event Overview</h1>
        <p className="text-sm text-slate-600">Event ID: {eventId}</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-medium">Chat Context</h2>
          <p className="text-sm text-slate-600">
            Render the live chat thread with the AI assistant, following the conversation examples in docs/messaging.md.
          </p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-medium">Event Elements</h2>
          <p className="text-sm text-slate-600">
            Populate this card stack with elements, status indicators, and vendor callouts from the client interface spec.
          </p>
        </article>
      </div>
    </section>
  );
}
