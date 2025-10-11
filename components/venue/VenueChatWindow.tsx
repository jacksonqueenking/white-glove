import { BaseChatWindow } from "../chat/BaseChatWindow";

const MESSAGES = [
  {
    id: "m1",
    role: "assistant" as const,
    name: "White Glove",
    timestamp: "5 min ago",
    content:
      "Good morning! The Smith wedding is coming up on Oct 15. You have 3 items that need attention: catering confirmation, final guest count, and photography shot list.",
  },
  {
    id: "m2",
    role: "user" as const,
    name: "You",
    timestamp: "3 min ago",
    content:
      "Thanks for the reminder. Can you check with Bella's Catering about the vegetarian menu options we discussed?",
  },
  {
    id: "m3",
    role: "assistant" as const,
    name: "White Glove",
    timestamp: "Just now",
    content:
      "I'll send a message to Bella's Catering about the vegetarian menu options and create a follow-up task for you. I'll also notify the client once we receive confirmation.",
  },
];

const SUGGESTED_REPLY =
  "Perfect. Also remind them we need final headcount confirmation by Oct 8.";

// Venue-facing chat window with AI assistant.
export function VenueChatWindow() {
  return (
    <BaseChatWindow
      messages={MESSAGES}
      suggestedReply={SUGGESTED_REPLY}
      config={{
        title: "White Glove Assistant",
        subtitle: "I help coordinate events, manage vendors, and communicate with clients automatically.",
        placeholder: "e.g. Send a reminder to all vendors about the deadline.",
        label: "Ask about events, vendors, or tasks",
        assistantLabel: "Venue coordinator",
      }}
    />
  );
}
