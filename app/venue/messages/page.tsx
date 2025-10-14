import { MessageThreadList } from "../../../components/messages/MessageThreadList";

const MESSAGE_THREADS = [
  {
    id: "1",
    senderName: "Jane Smith",
    senderType: "client" as const,
    eventName: "Smith Wedding",
    subject: "Flower Color Change",
    preview: "Can we change the flower colors to more pink and less red? I'd like to see some options...",
    timestamp: "2 hours ago",
    unread: true,
    actionRequired: true,
  },
  {
    id: "2",
    senderName: "Bella's Catering",
    senderType: "vendor" as const,
    eventName: "Johnson Corp Event",
    subject: "Menu Finalized",
    preview: "The menu has been finalized and we're ready to proceed with the confirmed headcount...",
    timestamp: "Yesterday",
    unread: false,
  },
  {
    id: "3",
    senderName: "Mike Wilson",
    senderType: "client" as const,
    eventName: "Martinez Party",
    subject: "Setup Time Question",
    preview: "What time can we start setting up decorations? We have a lot to bring in...",
    timestamp: "2 days ago",
    unread: false,
  },
  {
    id: "4",
    senderName: "Lens & Light Photography",
    senderType: "vendor" as const,
    eventName: "Smith Wedding",
    subject: "Lighting Test Request",
    preview: "Would it be possible to schedule a lighting test before the event? We want to ensure...",
    timestamp: "3 days ago",
    unread: false,
    actionRequired: true,
  },
];

// Venue message center for client and vendor communications.
export default function VenueMessagesPage() {
  return (
    <MessageThreadList
      threads={MESSAGE_THREADS}
      mode="venue"
    />
  );
}
