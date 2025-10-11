'use client';

interface PaymentScheduleItem {
  label: string;
  due: string;
  amount: string;
  status: "Paid" | "Awaiting payment" | "Overdue";
}

interface PaymentElement {
  id: string;
  name: string;
  description?: string;
  status: string;
  total: string;
  schedule: PaymentScheduleItem[];
}

interface PaymentHistoryItem {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: string;
  method?: string;
}

interface ContractBillingProps {
  eventId: string;
  elements: PaymentElement[];
  paymentHistory: PaymentHistoryItem[];
  totals: {
    total: number;
    paid: number;
    outstanding: number;
  };
  mode?: "client" | "venue";
  onPayNow?: (elementId: string) => void;
  onMarkAsPaid?: (elementId: string) => void;
  onGenerateInvoice?: () => void;
  onSendReminder?: () => void;
  onDownloadReceipts?: () => void;
}

// Unified contract and billing component for client (payment) and venue (tracking) views.
export function ContractBilling({
  eventId,
  elements,
  paymentHistory,
  totals,
  mode = "client",
  onPayNow,
  onMarkAsPaid,
  onGenerateInvoice,
  onSendReminder,
  onDownloadReceipts,
}: ContractBillingProps) {
  const isVenue = mode === "venue";

  return (
    <section className="mx-auto max-w-6xl space-y-10">
      <header className="glass-card flex flex-wrap items-start justify-between gap-6 px-8 py-7">
        <div className="max-w-2xl space-y-3">
          <h1 className="text-3xl font-semibold text-[#3f3a33]">Contract &amp; billing</h1>
          <p className="text-sm leading-relaxed text-[#6f6453]">
            {isVenue
              ? "Track payment status and manage invoicing for this event."
              : "Review each element's payment schedule, upcoming due dates, and settle balances securely through Stripe."}
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-[#b09c86]">Event ID • {eventId}</p>
        </div>
        <aside className="glass-card flex min-w-[260px] flex-col gap-2 rounded-2xl border-[#e7dfd4] bg-[#fdf5ef] px-5 py-4 text-sm text-[#6f6453] shadow-none">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b09c86]">Balance summary</p>
          <p className="flex items-center justify-between text-sm">
            <span>Total contract value</span>
            <span className="font-semibold text-[#3f3a33]">${totals.total.toLocaleString()}</span>
          </p>
          <p className="flex items-center justify-between text-sm">
            <span>Paid to date</span>
            <span className="font-semibold text-[#3c8650]">${totals.paid.toLocaleString()}</span>
          </p>
          <p className="flex items-center justify-between text-sm">
            <span>Outstanding</span>
            <span className="font-semibold text-[#c96f3a]">${totals.outstanding.toLocaleString()}</span>
          </p>
          {!isVenue && totals.outstanding > 0 && (
            <button
              type="button"
              onClick={() => onPayNow?.("")}
              className="mt-3 inline-flex items-center justify-center rounded-full bg-[#f0bda4] px-4 py-2 text-sm font-semibold text-[#624230] transition hover:bg-[#eba98a]"
            >
              Pay outstanding balance
            </button>
          )}
          {isVenue && (
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={onGenerateInvoice}
                className="inline-flex items-center justify-center rounded-full border border-[#e7dfd4] px-4 py-2 text-xs font-medium text-[#6f6453] transition hover:bg-[#f1e9df]"
              >
                Generate Invoice
              </button>
              <button
                type="button"
                onClick={onSendReminder}
                className="inline-flex items-center justify-center rounded-full border border-[#e7dfd4] px-4 py-2 text-xs font-medium text-[#6f6453] transition hover:bg-[#f1e9df]"
              >
                Send Reminder
              </button>
            </div>
          )}
        </aside>
      </header>

      <section className="space-y-5">
        <header className="space-y-1">
          <h2 className="text-xl font-semibold text-[#3f3a33]">Element breakdown</h2>
          <p className="text-sm text-[#6f6453]">
            {isVenue
              ? "Review payment status for each service and element."
              : "Track where every service stands and jump back into Stripe when a payment is pending."}
          </p>
        </header>
        <div className="space-y-5">
          {elements.map((element) => (
            <article key={element.id} className="glass-card px-7 py-6">
              <header className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-[#3f3a33]">{element.name}</h3>
                  {element.description && (
                    <p className="text-sm text-[#6f6453]">{element.description}</p>
                  )}
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
                  {element.schedule.map((step, index) => (
                    <tr key={`${element.id}-${index}`}>
                      <td className="py-3">{step.label}</td>
                      <td className="py-3 text-[#a18a72]">{step.due}</td>
                      <td className="py-3">{step.amount}</td>
                      <td className="py-2 text-right">
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                            step.status === "Paid"
                              ? "bg-[#e4f1e6] text-[#3c8650]"
                              : step.status === "Overdue"
                              ? "bg-[#fde9e1] text-[#c96f3a]"
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
                <div className="mt-5">
                  {isVenue ? (
                    <button
                      type="button"
                      onClick={() => onMarkAsPaid?.(element.id)}
                      className="inline-flex items-center justify-center rounded-full bg-[#f0bda4] px-4 py-2 text-sm font-semibold text-[#624230] transition hover:bg-[#eba98a]"
                    >
                      Mark as Paid
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onPayNow?.(element.id)}
                      className="inline-flex items-center justify-center rounded-full border border-[#e7dfd4] px-4 py-2 text-sm font-medium text-[#6f6453] transition hover:bg-[#f1e9df]"
                    >
                      Pay with Stripe
                    </button>
                  )}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="glass-card px-7 py-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-[#3f3a33]">Payment history</h2>
            <p className="text-sm text-[#6f6453]">
              {isVenue
                ? "All payment transactions for this event."
                : "Receipts and transaction IDs arrive instantly via email."}
            </p>
          </div>
          <button
            type="button"
            onClick={onDownloadReceipts}
            className="inline-flex items-center justify-center rounded-full border border-[#e7dfd4] px-4 py-2 text-sm font-medium text-[#6f6453] transition hover:bg-[#f1e9df]"
          >
            Download receipts
          </button>
        </header>
        <ul className="mt-5 divide-y divide-[#f0e7da] text-sm text-[#6f6453]">
          {paymentHistory.map((payment) => (
            <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium text-[#4d463b]">{payment.description}</p>
                <p className="text-xs text-[#a18a72]">
                  {payment.date}
                  {isVenue && payment.method && ` • ${payment.method}`}
                </p>
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
