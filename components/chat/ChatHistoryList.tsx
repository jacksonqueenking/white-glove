// List of previous conversations shown beneath the chat window per client interface spec.
export function ChatHistoryList() {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-600">Recent Conversations</h3>
      <ul className="space-y-1 text-xs text-slate-500">
        <li className="rounded border border-slate-200 bg-white p-2">Initial planning call (Oct 1)</li>
        <li className="rounded border border-slate-200 bg-white p-2">Menu options (Oct 3)</li>
        <li className="rounded border border-slate-200 bg-white p-2">Photography follow-up (Oct 5)</li>
      </ul>
    </div>
  );
}
