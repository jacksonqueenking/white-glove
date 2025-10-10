import type { ReactNode } from "react";

// Vendor portal layout with streamlined navigation.
export default function VendorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="vendor-shell flex min-h-screen bg-white">
      <aside className="w-64 border-r border-slate-200 bg-slate-50 p-6">
        <h1 className="text-lg font-semibold">Vendor Portal</h1>
        <p className="mt-2 text-xs text-slate-500">
          Populate with navigation for messages, events, and venues following docs/frontend/vendor-interface.md.
        </p>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
