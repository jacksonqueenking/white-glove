'use client';

import { useState } from "react";

interface Task {
  id: string;
  title: string;
  eventName: string;
  eventId: string;
  priority: "low" | "normal" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed";
  dueDate: string;
  description?: string;
  assignedTo?: string;
}

interface TaskListViewProps {
  tasks: Task[];
  mode?: "client" | "venue" | "vendor";
  onTaskClick?: (taskId: string, eventId: string) => void;
  onMarkComplete?: (taskId: string) => void;
  onViewEvent?: (eventId: string) => void;
}

const PRIORITY_CONFIG = {
  urgent: { icon: "🔴", label: "Urgent", color: "text-[#c96f3a]" },
  high: { icon: "🟠", label: "High", color: "text-[#a87b3b]" },
  normal: { icon: "🟡", label: "Normal", color: "text-[#a87b3b]" },
  low: { icon: "🔵", label: "Low", color: "text-[#6f6453]" },
};

const STATUS_CONFIG = {
  pending: { label: "Pending", badge: "bg-[#fde9e1] text-[#c96f3a]" },
  in_progress: { label: "In Progress", badge: "bg-[#f6e7d0] text-[#a87b3b]" },
  completed: { label: "Completed", badge: "bg-[#e4f1e6] text-[#3c8650]" },
};

// Unified task list view for managing tasks across events.
export function TaskListView({
  tasks,
  mode = "client",
  onTaskClick,
  onMarkComplete,
  onViewEvent,
}: TaskListViewProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | Task["status"]>("all");
  const [filterPriority, setFilterPriority] = useState<"all" | Task["priority"]>("all");

  const filteredTasks = tasks.filter((task) => {
    if (filterStatus !== "all" && task.status !== filterStatus) return false;
    if (filterPriority !== "all" && task.priority !== filterPriority) return false;
    return true;
  });

  const pendingCount = tasks.filter((t) => t.status === "pending").length;

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    onTaskClick?.(task.id, task.eventId);
  };

  const handleMarkComplete = (taskId: string) => {
    onMarkComplete?.(taskId);
    setSelectedTask(null);
  };

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#3f3a33]">Tasks</h1>
          <p className="mt-1 text-sm text-[#6f6453]">
            {pendingCount > 0
              ? `${pendingCount} pending task${pendingCount > 1 ? "s" : ""}`
              : "All tasks completed"}
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full bg-[#fef1e4] p-1">
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={[
              "rounded-full px-4 py-2 text-sm font-medium transition",
              filterStatus === "all"
                ? "bg-white text-[#3f3a33] shadow"
                : "text-[#a18a72] hover:text-[#7d6a55]",
            ].join(" ")}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("pending")}
            className={[
              "rounded-full px-4 py-2 text-sm font-medium transition",
              filterStatus === "pending"
                ? "bg-white text-[#3f3a33] shadow"
                : "text-[#a18a72] hover:text-[#7d6a55]",
            ].join(" ")}
          >
            Pending
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("completed")}
            className={[
              "rounded-full px-4 py-2 text-sm font-medium transition",
              filterStatus === "completed"
                ? "bg-white text-[#3f3a33] shadow"
                : "text-[#a18a72] hover:text-[#7d6a55]",
            ].join(" ")}
          >
            Completed
          </button>
        </div>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as typeof filterPriority)}
          className="rounded-full border border-[#e7dfd4] bg-white px-4 py-2 text-sm text-[#3f3a33] focus:border-[#d9c8b5] focus:outline-none focus:ring-2 focus:ring-[#f4d8c4]"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="rounded-3xl border border-[#e7dfd4] bg-white p-12 text-center">
            <p className="text-sm text-[#a18a72]">No tasks found</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const priorityConfig = PRIORITY_CONFIG[task.priority];
            const statusConfig = STATUS_CONFIG[task.status];

            return (
              <button
                key={task.id}
                type="button"
                onClick={() => handleTaskClick(task)}
                className="flex w-full items-start gap-4 rounded-3xl border border-[#e7dfd4] bg-white px-6 py-5 text-left transition hover:border-[#f0bda4] hover:bg-[#fff2e8]"
              >
                <span className="text-2xl" aria-label={priorityConfig.label}>
                  {priorityConfig.icon}
                </span>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-[#3f3a33]">{task.title}</p>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusConfig.badge}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>
                  <p className="text-xs text-[#6f6453]">
                    {task.eventName} • {task.dueDate}
                  </p>
                  {task.status !== "completed" && (
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewEvent?.(task.eventId);
                        }}
                        className="inline-flex items-center justify-center rounded-full border border-[#e7dfd4] px-3 py-1.5 text-xs font-medium text-[#6f6453] transition hover:bg-[#f1e9df]"
                      >
                        View Event
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkComplete(task.id);
                        }}
                        className="inline-flex items-center justify-center rounded-full bg-[#e4f1e6] px-3 py-1.5 text-xs font-semibold text-[#3c8650] transition hover:bg-[#d4e6d6]"
                      >
                        Mark Complete
                      </button>
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-[#e7dfd4] bg-white p-8 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-[#3f3a33]">{selectedTask.title}</h2>
            <div className="mt-4 space-y-3 text-sm text-[#6f6453]">
              <p>
                <span className="font-semibold text-[#4d463b]">Event:</span> {selectedTask.eventName}
              </p>
              <p>
                <span className="font-semibold text-[#4d463b]">Due:</span> {selectedTask.dueDate}
              </p>
              <p>
                <span className="font-semibold text-[#4d463b]">Priority:</span>{" "}
                {PRIORITY_CONFIG[selectedTask.priority].label}
              </p>
              {selectedTask.description && (
                <div>
                  <p className="font-semibold text-[#4d463b]">Description:</p>
                  <p className="mt-1 leading-relaxed">{selectedTask.description}</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="inline-flex items-center justify-center rounded-full border border-[#e7dfd4] px-5 py-2 text-sm font-medium text-[#6f6453] transition hover:bg-[#f1e9df]"
              >
                Close
              </button>
              {selectedTask.status !== "completed" && (
                <button
                  type="button"
                  onClick={() => handleMarkComplete(selectedTask.id)}
                  className="inline-flex items-center justify-center rounded-full bg-[#f0bda4] px-5 py-2 text-sm font-semibold text-[#624230] transition hover:bg-[#eba98a]"
                >
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
