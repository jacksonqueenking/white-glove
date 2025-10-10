import { assembleEventState } from "./state/eventGraph";
import { runTaskTools } from "./tools/taskTools";

interface OrchestratorInput {
  eventId: string;
  trigger: "conversation" | "action" | "time" | "webhook";
  payload: unknown;
}

// High-level placeholder for LangGraph orchestrator entry point.
export async function orchestrate(input: OrchestratorInput) {
  const state = await assembleEventState(input.eventId);

  // TODO: Evaluate workflows, create tasks, route messages per docs/ai-agents.md
  await runTaskTools({ state, trigger: input.trigger, payload: input.payload });

  return {
    nextActions: [],
    debug: {
      eventId: input.eventId,
      trigger: input.trigger,
    },
  };
}
