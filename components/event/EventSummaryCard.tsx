interface EventSummaryCardProps {
  title: string;
  status: "todo" | "in_progress" | "completed" | "attention";
  description?: string;
}

const STATUS_LABELS: Record<EventSummaryCardProps["status"], string> = {
  todo: "● To do",
  in_progress: "● In progress",
  completed: "● Complete",
  attention: "❗ Needs attention",
};

// Represents an element row in the client event stack.
export function EventSummaryCard({ title, status, description }: EventSummaryCardProps) {
  return (
    <article className="rounded border border-slate-200 bg-white p-4">
      <header className="flex items-center justify-between text-sm">
        <h3 className="font-medium text-slate-700">{title}</h3>
        <span className="text-xs text-slate-500">{STATUS_LABELS[status]}</span>
      </header>
      {description ? <p className="mt-2 text-xs text-slate-500">{description}</p> : null}
    </article>
  );
}
