import type { ReactNode } from "react";

interface ShellProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

// Generic layout shell usable across personas.
export function Shell({ title, description, actions, children }: ShellProps) {
  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
          {description ? <p className="text-sm text-slate-600">{description}</p> : null}
        </div>
        {actions ? <div className="flex gap-2">{actions}</div> : null}
      </header>
      <div>{children}</div>
    </section>
  );
}
