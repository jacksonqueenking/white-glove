import type { ToolDefinition } from "../ai/tools";

interface ClientAssistantContext {
  eventId: string;
  clientId: string;
  message: string;
}

// Define the client-facing AI assistant behavior scaffold.
export class ClientAssistant {
  constructor(private readonly tools: ToolDefinition[]) {}

  async handleMessage(context: ClientAssistantContext) {
    // TODO: Call orchestrator, decide on tool usage, and return assistant responses.
    return {
      replies: [
        {
          role: "assistant",
          content: "Client assistant placeholder response."
        }
      ],
      invokedTools: this.tools.map((tool) => tool.name),
    };
  }
}
