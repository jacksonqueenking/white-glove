interface TaskInput {
  eventId: string;
  assignedToId: string;
  assignedToType: "client" | "venue" | "vendor";
  name: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  formSchema?: unknown;
  dueDate?: string;
}

// Create tasks aligned with orchestrator guidance.
export async function createTask(input: TaskInput) {
  // TODO: Persist to Supabase, notify assignees, and record in action history.
  return {
    ...input,
    taskId: "generated-task-id",
  };
}

// Placeholder updater for task status changes.
export async function updateTask(taskId: string, updates: Partial<TaskInput>) {
  // TODO: Apply updates and emit real-time notifications.
  return { taskId, updates };
}
