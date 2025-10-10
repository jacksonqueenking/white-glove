interface ContractPageProps {
  params: Promise<{ eventId: string }>;
}

const ELEMENT_BREAKDOWN = [
  {
    id: "venue",
    name: "Venue Rental",
    status: "Paid in full",
    total: "$2,500",
    schedule: [
      { label: "Deposit (50%)", due: "Paid Jun 15", amount: "$1,250", status: "Paid" },
      { label: "Remaining balance", due: "Due Sep 15", amount: "$1,250", status: "Paid" },
    ],
  },
  {
    id: "catering",
    name: "Catering",
    status: "Deposit paid",
    total: "$8,000",
    schedule: [
      { label: "Deposit (50%)", due: "Paid Sep 20", amount: "$4,000", status: "Paid" },
      { label: "Final payment", due: "Due Oct 8", amount: "$4,000", status: "Awaiting payment" },
    ],
  },
  {
    id: "photography",
    name: "Photography",
    status: "Unpaid",
    total: "$2,000",
    schedule: [
      { label: "Full payment", due: "Due Oct 1", amount: "$2,000", status: "Awaiting payment" },
    ],
  },
];

const PAYMENT_HISTORY = [
  { id: "p1", date: "Sep 20, 2025", description: "Catering deposit", amount: "$4,000", status: "Paid" },
  { id: "p2", date: "Sep 15, 2025", description: "Venue final balance", amount: "$1,250", status: "Paid" },
  { id: "p3", date: "Jun 15, 2025", description: "Venue deposit", amount: "$1,250", status: "Paid" },
];

// Contract and billing overview following the Stripe payment flow.
export default async function ContractAndBillingPage({ params }: ContractPageProps) {
  const { eventId } = await params;

  return (
    <section className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Contract & Billing</h1>
          <p className="mt-2 text-sm text-slate-600">
            Review the full payment schedule for each element. Pay outstanding balances through secure Stripe checkout.
          </p>
          <p className="mt-2 text-xs text-slate-500">Event ID: {eventId}</p>
        </div>
        <aside className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Balance summary</p>
          <p className="mt-2 flex items-center justify-between">
            <span>Total contract value</span>
            <span className="font-semibold">$12,500</span>
          </p>
          <p className="mt-1 flex items-center justify-between">
            <span>Paid to date</span>
            <span className="font-semibold text-emerald-600">$6,500</span>
          </p>
          <p className="mt-1 flex items-center justify-between">
            <span>Outstanding</span>
            <span className="font-semibold text-rose-500">$6,000</span>
          </p>
          <p className="mt-2 text-xs text-slate-500">Next payment due Oct 1, 2025.</p>
          <button
            type="button"
            className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Pay outstanding balance
          </button>
        </aside>
      </header>

      <section className="space-y-4">
        <header>
          <h2 className="text-xl font-semibold text-slate-900">Element breakdown</h2>
          <p className="mt-1 text-sm text-slate-600">
            Each service shows its payment schedule, due dates, and Stripe checkout link if payment is pending.
          </p>
        </header>
        <div className="space-y-4">
          {ELEMENT_BREAKDOWN.map((element) => (
            <article key={element.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{element.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">Status: {element.status}</p>
                </div>
                <div className="text-right text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Total</p>
                  <p className="mt-1 text-2xl font-bold">{element.total}</p>
                </div>
              </header>
              <table className="mt-4 w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2">Payment</th>
                    <th className="py-2">Due</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {element.schedule.map((step) => (
                    <tr key={`${element.id}-${step.label}`}>
                      <td className="py-2">{step.label}</td>
                      <td className="py-2 text-slate-500">{step.due}</td>
                      <td className="py-2">{step.amount}</td>
                      <td className="py-2 text-right">
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                            step.status === "Paid"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-amber-50 text-amber-700",
                          ].join(" ")}
                        >
                          {step.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {element.schedule.some((step) => step.status !== "Paid") ? (
                <button
                  type="button"
                  className="mt-4 inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                >
                  Pay with Stripe
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Payment history</h2>
            <p className="mt-1 text-sm text-slate-600">Receipts and transaction IDs are emailed automatically.</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            Download receipts
          </button>
        </header>
        <ul className="mt-4 divide-y divide-slate-100 text-sm text-slate-700">
          {PAYMENT_HISTORY.map((payment) => (
            <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium text-slate-800">{payment.description}</p>
                <p className="text-xs text-slate-500">{payment.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-slate-900">{payment.amount}</span>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-600">
                  {payment.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
