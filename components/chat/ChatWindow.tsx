import { BaseChatWindow } from "./BaseChatWindow";

const MESSAGES = [
  {
    id: "m1",
    role: "assistant" as const,
    name: "White Glove",
    timestamp: "2 min ago",
    content:
      "Morning, Emma! Catering is almost ready to finalize. I captured your vegetarian adjustments and highlighted the tasks we still need to close before Friday.",
  },
  {
    id: "m2",
    role: "user" as const,
    name: "You",
    timestamp: "1 min ago",
    content:
      "Perfect—can you confirm with Bella's Catering that the portobello entrée can be made gluten-free for my guests that need it?",
  },
  {
    id: "m3",
    role: "assistant" as const,
    name: "White Glove",
    timestamp: "Just now",
    content:
      "Absolutely. I can send a coordinated message to the venue and caterer, include the 12 gluten-free guests in the note, and create a follow-up task for you.",
  },
];

const SUGGESTED_REPLY =
  "Yes, send that update and set a reminder if we do not hear back by tomorrow afternoon.";

// Client-facing chat window with AI assistant.
export function ChatWindow() {
  return (
    <BaseChatWindow
      messages={MESSAGES}
      suggestedReply={SUGGESTED_REPLY}
      config={{
        title: "White Glove Assistant",
        subtitle: "Chat naturally and I'll coordinate updates with your venue and vendors automatically.",
        placeholder: "e.g. Remind the florist our ceremony starts at 5pm outdoors.",
        label: "Ask anything about your event",
        assistantLabel: "Client concierge",
      }}
    />
  );
}
