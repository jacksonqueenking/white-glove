import { MessageThreadList } from "../../../components/messages/MessageThreadList";

const MESSAGE_THREADS = [
  {
    id: "1",
    senderName: "The Grand Ballroom",
    senderType: "venue" as const,
    eventName: "Smith Wedding",
    subject: "Final Walkthrough Scheduled",
    preview: "Your final venue walkthrough has been scheduled for Oct 8 at 2 PM. Please confirm...",
    timestamp: "3 hours ago",
    unread: true,
  },
  {
    id: "2",
    senderName: "Bella's Catering",
    senderType: "vendor" as const,
    eventName: "Smith Wedding",
    subject: "Menu Confirmation",
    preview: "We've updated the vegetarian options as requested. Please review the attached menu...",
    timestamp: "Yesterday",
    unread: false,
    actionRequired: true,
  },
  {
    id: "3",
    senderName: "Lens & Light Photography",
    senderType: "vendor" as const,
    eventName: "Smith Wedding",
    subject: "Shot List Request",
    preview: "To ensure we capture all your special moments, please provide your shot list by Oct 10...",
    timestamp: "2 days ago",
    unread: false,
    actionRequired: true,
  },
];

// Client message center for venue and vendor communications.
export default function ClientMessagesPage() {
  return (
    <MessageThreadList
      threads={MESSAGE_THREADS}
      mode="client"
    />
  );
}
