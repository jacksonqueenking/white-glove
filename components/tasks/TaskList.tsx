interface TaskItem {
  id: string;
  name: string;
  assignedTo: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
}

const PRIORITY_LABEL: Record<TaskItem["priority"], string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

// Shared task list component following orchestration guidelines.
export function TaskList({ tasks }: { tasks: TaskItem[] }) {
  return (
    <ul className="space-y-2">
      {tasks.map((task) => (
        <li key={task.id} className="rounded border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">{task.name}</h3>
            <span className="text-xs text-slate-500">{PRIORITY_LABEL[task.priority]}</span>
          </div>
          <p className="text-xs text-slate-500">Assigned to: {task.assignedTo}</p>
          {task.dueDate ? <p className="text-xs text-slate-500">Due {task.dueDate}</p> : null}
        </li>
      ))}
    </ul>
  );
}
