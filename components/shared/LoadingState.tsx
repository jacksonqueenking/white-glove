// Simple skeleton/loader placeholder.
export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="animate-pulse rounded border border-slate-200 bg-slate-100 p-4 text-sm text-slate-500">
      {label}
    </div>
  );
}
