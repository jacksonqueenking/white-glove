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
    <section className="mx-auto max-w-6xl space-y-10">
      <header className="glass-card flex flex-wrap items-start justify-between gap-6 px-8 py-7">
        <div className="max-w-2xl space-y-3">
          <h1 className="text-3xl font-semibold text-[#3f3a33]">Contract &amp; billing</h1>
          <p className="text-sm leading-relaxed text-[#6f6453]">
            Review each element’s payment schedule, upcoming due dates, and settle balances securely through Stripe.
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-[#b09c86]">Event ID • {eventId}</p>
        </div>
        <aside className="glass-card flex min-w-[260px] flex-col gap-2 rounded-2xl border-[#e7dfd4] bg-[#fdf5ef] px-5 py-4 text-sm text-[#6f6453] shadow-none">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b09c86]">Balance summary</p>
          <p className="flex items-center justify-between text-sm">
            <span>Total contract value</span>
            <span className="font-semibold text-[#3f3a33]">$12,500</span>
          </p>
          <p className="flex items-center justify-between text-sm">
            <span>Paid to date</span>
            <span className="font-semibold text-[#3c8650]">$6,500</span>
          </p>
          <p className="flex items-center justify-between text-sm">
            <span>Outstanding</span>
            <span className="font-semibold text-[#c96f3a]">$6,000</span>
          </p>
          <p className="text-xs text-[#a18a72]">Next payment due Oct 1, 2025.</p>
          <button
            type="button"
            className="mt-3 inline-flex items-center justify-center rounded-full bg-[#f0bda4] px-4 py-2 text-sm font-semibold text-[#624230] transition hover:bg-[#eba98a]"
          >
            Pay outstanding balance
          </button>
        </aside>
      </header>

      <section className="space-y-5">
        <header className="space-y-1">
          <h2 className="text-xl font-semibold text-[#3f3a33]">Element breakdown</h2>
          <p className="text-sm text-[#6f6453]">
            Track where every service stands and jump back into Stripe when a payment is pending.
          </p>
        </header>
        <div className="space-y-5">
          {ELEMENT_BREAKDOWN.map((element) => (
            <article key={element.id} className="glass-card px-7 py-6">
              <header className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-[#3f3a33]">{element.name}</h3>
                  <span className="inline-flex items-center rounded-full bg-[#fef5ef] px-3 py-1 text-xs font-medium text-[#b16455]">
                    {element.status}
                  </span>
                </div>
                <div className="text-right text-sm text-[#6f6453]">
                  <p className="font-semibold text-[#4d463b]">Total</p>
                  <p className="mt-1 text-2xl font-bold text-[#3f3a33]">{element.total}</p>
                </div>
              </header>
              <table className="mt-4 w-full text-sm text-[#6f6453]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-[0.18em] text-[#b09c86]">
                    <th className="py-2 font-medium">Payment</th>
                    <th className="py-2 font-medium">Due</th>
                    <th className="py-2 font-medium">Amount</th>
                    <th className="py-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0e7da]">
                  {element.schedule.map((step) => (
                    <tr key={`${element.id}-${step.label}`}>
                      <td className="py-3">{step.label}</td>
                      <td className="py-3 text-[#a18a72]">{step.due}</td>
                      <td className="py-3">{step.amount}</td>
                      <td className="py-2 text-right">
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                            step.status === "Paid"
                              ? "bg-[#e4f1e6] text-[#3c8650]"
                              : "bg-[#f9edd6] text-[#a87b3b]",
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
                  className="mt-5 inline-flex items-center justify-center rounded-full border border-[#e7dfd4] px-4 py-2 text-sm font-medium text-[#6f6453] transition hover:bg-[#f1e9df]"
                >
                  Pay with Stripe
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="glass-card px-7 py-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-[#3f3a33]">Payment history</h2>
            <p className="text-sm text-[#6f6453]">Receipts and transaction IDs arrive instantly via email.</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-[#e7dfd4] px-4 py-2 text-sm font-medium text-[#6f6453] transition hover:bg-[#f1e9df]"
          >
            Download receipts
          </button>
        </header>
        <ul className="mt-5 divide-y divide-[#f0e7da] text-sm text-[#6f6453]">
          {PAYMENT_HISTORY.map((payment) => (
            <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium text-[#4d463b]">{payment.description}</p>
                <p className="text-xs text-[#a18a72]">{payment.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-[#3f3a33]">{payment.amount}</span>
                <span className="inline-flex items-center rounded-full bg-[#e4f1e6] px-2 py-1 text-xs font-medium text-[#3c8650]">
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
