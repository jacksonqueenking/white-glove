interface MessagePayload {
  threadId?: string;
  subject: string;
  participants: string[];
  body: string;
  context?: Record<string, unknown>;
}

// Create or append to message threads per messaging documentation.
export async function sendMessage(payload: MessagePayload) {
  // TODO: Persist to Supabase and notify via lib/notifications.
  return {
    ...payload,
    threadId: payload.threadId ?? "generated-thread-id",
    deliveredAt: new Date().toISOString(),
  };
}
