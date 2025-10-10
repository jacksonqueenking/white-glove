// Configure Supabase real-time subscriptions for tasks, elements, and messages.
export function subscribeToEventChannels(eventId: string) {
  // TODO: Use Supabase channel API to listen for postgres changes, chat updates, and payments.
  return {
    unsubscribe: () => {
      // Placeholder noop
    },
  };
}
