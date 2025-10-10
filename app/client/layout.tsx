import type { ReactNode } from "react";

// Client persona layout with split-screen chat and detail panel placeholders.
export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="client-shell grid min-h-screen grid-cols-[420px_1fr] bg-slate-50">
      <aside className="border-r border-slate-200 bg-white p-6">
        <p className="text-sm font-semibold text-slate-600">Client Assistant Chat</p>
        <p className="mt-2 text-xs text-slate-500">
          Replace with chat history list and AI assistant composer per docs/frontend/client-interface.md.
        </p>
      </aside>
      <main className="p-8">{children}</main>
    </div>
  );
}
