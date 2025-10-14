import { TaskListView } from "../../../components/tasks/TaskListView";

const TASKS = [
  {
    id: "1",
    title: "Approve catering menu adjustments",
    eventName: "Smith Wedding",
    eventId: "event-1",
    priority: "high" as const,
    status: "pending" as const,
    dueDate: "Due Oct 8",
    description: "Review and approve the updated vegetarian menu options from Bella's Catering.",
  },
  {
    id: "2",
    title: "Upload photography shot list",
    eventName: "Smith Wedding",
    eventId: "event-1",
    priority: "normal" as const,
    status: "pending" as const,
    dueDate: "Due Oct 10",
    description: "Provide your must-have photo list to Lens & Light Photography for the big day.",
  },
  {
    id: "3",
    title: "Review floral proposals from Petals & Co.",
    eventName: "Smith Wedding",
    eventId: "event-1",
    priority: "normal" as const,
    status: "pending" as const,
    dueDate: "Review by Oct 12",
    description: "Check out the updated color palette options and select your favorite.",
  },
  {
    id: "4",
    title: "Confirm final guest count",
    eventName: "Smith Wedding",
    eventId: "event-1",
    priority: "urgent" as const,
    status: "pending" as const,
    dueDate: "Due Oct 7",
    description: "Provide final headcount to the venue for catering and seating arrangements.",
  },
  {
    id: "5",
    title: "Contract signed",
    eventName: "Smith Wedding",
    eventId: "event-1",
    priority: "normal" as const,
    status: "completed" as const,
    dueDate: "Completed Sep 15",
    description: "Venue rental contract reviewed and signed.",
  },
];

// Client tasks dashboard for managing event to-dos.
export default function ClientTasksPage() {
  return (
    <TaskListView
      tasks={TASKS}
      mode="client"
    />
  );
}
