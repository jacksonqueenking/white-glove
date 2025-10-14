import { TaskListView } from "../../../components/tasks/TaskListView";

const TASKS = [
  {
    id: "1",
    title: "Contract signature needed",
    eventName: "Smith Wedding",
    eventId: "event-1",
    priority: "urgent" as const,
    status: "pending" as const,
    dueDate: "Due in 2 days",
    description: "Client needs to review and sign the updated contract with floral changes.",
  },
  {
    id: "2",
    title: "Confirm catering headcount",
    eventName: "Johnson Corp Event",
    eventId: "event-2",
    priority: "high" as const,
    status: "pending" as const,
    dueDate: "Due in 5 days",
    description: "Final headcount needed from client for catering order.",
  },
  {
    id: "3",
    title: "Schedule lighting test with photographer",
    eventName: "Smith Wedding",
    eventId: "event-1",
    priority: "normal" as const,
    status: "in_progress" as const,
    dueDate: "Due in 7 days",
    description: "Coordinate with Lens & Light Photography for venue lighting test.",
  },
  {
    id: "4",
    title: "Photography deposit received",
    eventName: "Martinez Party",
    eventId: "event-3",
    priority: "normal" as const,
    status: "completed" as const,
    dueDate: "Completed yesterday",
    description: "Payment received and confirmed with vendor.",
  },
  {
    id: "5",
    title: "COI renewal for Bella's Catering",
    eventName: "Multiple Events",
    eventId: "event-2",
    priority: "high" as const,
    status: "pending" as const,
    dueDate: "Due in 10 days",
    description: "Certificate of Insurance expires soon. Follow up with vendor.",
  },
];

// Venue tasks dashboard for managing event-related tasks.
export default function VenueTasksPage() {
  return (
    <TaskListView
      tasks={TASKS}
      mode="venue"
    />
  );
}
