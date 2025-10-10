// Displays human-to-human message threads per messaging documentation.
export function ThreadList() {
  return (
    <ul className="space-y-2">
      <li className="rounded border border-slate-200 bg-white p-3">
        <p className="text-sm font-medium text-slate-700">Smith Wedding • Venue ↔ Client</p>
        <p className="text-xs text-slate-500">Menu customization request • 2h ago</p>
      </li>
      <li className="rounded border border-slate-200 bg-white p-3">
        <p className="text-sm font-medium text-slate-700">Johnson Corp • Venue ↔ Vendor</p>
        <p className="text-xs text-slate-500">Confirm AV requirements • Yesterday</p>
      </li>
    </ul>
  );
}
