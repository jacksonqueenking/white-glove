interface ContractPageProps {
  params: Promise<{ eventId: string }>;
}

// Contract and billing placeholder referencing the Stripe payment flow.
export default async function ContractAndBillingPage({ params }: ContractPageProps) {
  const { eventId } = await params;

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Contract & Billing</h1>
        <p className="text-sm text-slate-600">Event {eventId}</p>
      </header>
      <p className="text-sm text-slate-600">
        Display element-level payment schedules, Stripe checkout entry points, and history per docs/payments.md.
      </p>
    </section>
  );
}
