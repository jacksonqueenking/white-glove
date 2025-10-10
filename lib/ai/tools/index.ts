// Export AI-invokable tools. Each tool should expose metadata and Zod-backed validation schemas.
export interface ToolDefinition {
  name: string;
  description: string;
  execute: (input: unknown) => Promise<unknown>;
}

export const tools: ToolDefinition[] = [];
