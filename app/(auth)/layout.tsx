import type { ReactNode } from "react";

// Shared auth layout for magic link and password flows.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
