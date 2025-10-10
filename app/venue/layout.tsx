import type { ReactNode } from "react";

// Venue dashboard layout with persistent navigation sidebar.
export default function VenueLayout({ children }: { children: ReactNode }) {
  return (
    <div className="venue-shell flex min-h-screen bg-slate-900 text-slate-50">
      <aside className="w-72 border-r border-slate-800 bg-slate-950 p-6">
        <h1 className="text-lg font-semibold">Venue Console</h1>
        <p className="mt-2 text-xs text-slate-400">
          Populate with navigation, AI chat summaries, and quick links described in docs/frontend/venue-interface.md.
        </p>
      </aside>
      <main className="flex-1 bg-slate-100 p-8 text-slate-900">{children}</main>
    </div>
  );
}
