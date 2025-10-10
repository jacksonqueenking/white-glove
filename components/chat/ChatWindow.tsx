// Chat window placeholder that will host the AI conversation UI.
export function ChatWindow() {
  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-4">
      <header className="mb-4">
        <h2 className="text-lg font-medium">Assistant Conversation</h2>
        <p className="text-xs text-slate-500">
          Stream chat messages, tool invocations, and status updates per docs/messaging.md.
        </p>
      </header>
      <div className="flex-1 overflow-y-auto bg-slate-50 p-3 text-sm text-slate-600">
        <p>Conversation history placeholder.</p>
      </div>
      <footer className="mt-4">
        <textarea
          className="w-full rounded border border-slate-300 p-2 text-sm"
          placeholder="Ask the assistant about your event..."
        />
      </footer>
    </div>
  );
}
