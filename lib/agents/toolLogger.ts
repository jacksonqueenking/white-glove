/**
 * Tool Execution Logger
 *
 * Provides comprehensive logging for AI tool calls including:
 * - Input parameters
 * - Execution results
 * - Errors and stack traces
 * - Execution timing
 */

interface LogContext {
  userId: string;
  userType: string;
  agentType?: string;
  eventId?: string;
  venueId?: string;
}

/**
 * Wraps a tool execution function with comprehensive logging
 */
export function withToolLogging<TInput, TOutput>(
  toolName: string,
  executeFn: (input: TInput) => Promise<TOutput>,
  context?: Partial<LogContext>
) {
  return async (input: TInput): Promise<TOutput> => {
    const startTime = Date.now();
    const logPrefix = `[Tool: ${toolName}]`;

    // Log input
    console.log(`${logPrefix} ========== TOOL CALL START ==========`);
    console.log(`${logPrefix} Input:`, JSON.stringify(input, null, 2));

    if (context) {
      console.log(`${logPrefix} Context:`, {
        userId: context.userId,
        userType: context.userType,
        agentType: context.agentType,
        eventId: context.eventId,
        venueId: context.venueId,
      });
    }

    try {
      // Execute the tool
      const result = await executeFn(input);
      const duration = Date.now() - startTime;

      // Log successful output
      console.log(`${logPrefix} ========== TOOL CALL SUCCESS ==========`);
      console.log(`${logPrefix} Duration: ${duration}ms`);
      console.log(`${logPrefix} Output:`, JSON.stringify(result, null, 2));
      console.log(`${logPrefix} ========== TOOL CALL END ==========`);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error details
      console.error(`${logPrefix} ========== TOOL CALL ERROR ==========`);
      console.error(`${logPrefix} Duration: ${duration}ms`);
      console.error(`${logPrefix} Error Type:`, error instanceof Error ? error.constructor.name : typeof error);
      console.error(`${logPrefix} Error Message:`, error instanceof Error ? error.message : String(error));

      if (error instanceof Error && error.stack) {
        console.error(`${logPrefix} Stack Trace:`, error.stack);
      }

      // Log any additional error properties
      if (error && typeof error === 'object') {
        const errorProps = Object.keys(error).filter(key => key !== 'message' && key !== 'stack');
        if (errorProps.length > 0) {
          console.error(`${logPrefix} Additional Error Properties:`,
            JSON.stringify(
              Object.fromEntries(errorProps.map(key => [key, (error as any)[key]])),
              null,
              2
            )
          );
        }
      }

      console.error(`${logPrefix} ========== TOOL CALL END (ERROR) ==========`);

      // Re-throw the error so it can be handled by the AI SDK
      throw error;
    }
  };
}

/**
 * Log messages returned to the LLM from tool executions
 */
export function logToolResultsForLLM(
  toolName: string,
  input: any,
  output: any,
  error?: any
) {
  const logPrefix = `[Tool Result to LLM: ${toolName}]`;

  console.log(`${logPrefix} ========== SENDING TO LLM ==========`);
  console.log(`${logPrefix} Tool Name: ${toolName}`);
  console.log(`${logPrefix} Input Sent:`, JSON.stringify(input, null, 2));

  if (error) {
    console.error(`${logPrefix} Error Result:`, JSON.stringify(error, null, 2));
  } else {
    console.log(`${logPrefix} Success Result:`, JSON.stringify(output, null, 2));
  }

  console.log(`${logPrefix} ========== END SENDING TO LLM ==========`);
}
