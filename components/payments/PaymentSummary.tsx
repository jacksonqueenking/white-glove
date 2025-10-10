interface PaymentItem {
  id: string;
  name: string;
  total: number;
  status: "unpaid" | "deposit_paid" | "paid";
}

const STATUS_LABEL: Record<PaymentItem["status"], string> = {
  unpaid: "⚫ Unpaid",
  deposit_paid: "🟡 Deposit paid",
  paid: "🟢 Fully paid",
};

// Contract and billing summary widget for clients and venues.
export function PaymentSummary({ items }: { items: PaymentItem[] }) {
  return (
    <div className="space-y-3 rounded border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold">Payment Schedule</h2>
      <ul className="space-y-2 text-sm text-slate-600">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between rounded border border-slate-100 p-3">
            <div>
              <p className="font-medium text-slate-700">{item.name}</p>
              <p className="text-xs text-slate-500">{STATUS_LABEL[item.status]}</p>
            </div>
            <span className="text-sm font-semibold">${item.total.toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <button className="w-full rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white">
        Pay Now
      </button>
    </div>
  );
}
