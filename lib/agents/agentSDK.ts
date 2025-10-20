/**
 * OpenAI Agents SDK Integration
 *
 * Sets up AI agents using OpenAI's Agents SDK with our existing
 * instructions, tools, and context builders.
 */

import { Agent, tool } from '@openai/agents';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/database.types.gen';
import {
  generateClientSystemPrompt,
  generateVenueGeneralSystemPrompt,
  generateVenueEventSystemPrompt,
} from './prompts';
import {
  buildClientContext,
  buildVenueGeneralContext,
  buildVenueEventContext,
} from './context';
import {
  clientToolHandlers,
  venueGeneralToolHandlers,
  venueEventToolHandlers,
  executeToolCall,
} from './toolHandlers';
import { clientTools, venueGeneralTools, venueEventTools } from './tools';

/**
 * Convert OpenAI tool definitions to Agents SDK tool format
 */
function convertToAgentTool(
  toolDef: any,
  handler: (params: any, context: any) => Promise<any>,
  context: { userId: string; userType: 'client' | 'venue' | 'vendor' }
) {
  // Extract the parameter schema
  const paramSchema = z.object(
    Object.entries(toolDef.function.parameters.properties).reduce((acc, [key, value]: [string, any]) => {
      // Check if field is required
      const isRequired = toolDef.function.parameters.required?.includes(key);

      // Convert JSON schema types to Zod types
      let zodType;
      if (value.type === 'string') {
        zodType = value.enum ? z.enum(value.enum) : z.string();
      } else if (value.type === 'number') {
        zodType = z.number();
      } else if (value.type === 'boolean') {
        zodType = z.boolean();
      } else if (value.type === 'object') {
        // OpenAI doesn't support z.record() or z.any() for objects
        // Convert to string and let the tool handler parse it
        if (isRequired) {
          zodType = z.string().describe('JSON string representing an object');
        } else {
          zodType = z.string().default('{}').describe('JSON string representing an object');
        }
      } else if (value.type === 'array') {
        // OpenAI doesn't support z.array(z.any()) well
        // Convert to string and let the tool handler parse it
        if (isRequired) {
          zodType = z.string().describe('JSON string representing an array');
        } else {
          zodType = z.string().default('[]').describe('JSON string representing an array');
        }
      } else {
        zodType = z.string(); // Default to string instead of any
      }

      // Add description before optional/nullable modifiers
      if (value.description) {
        zodType = zodType.describe(value.description);
      }

      // Make optional if not in required array (but not for objects/arrays - they have defaults)
      if (!isRequired && value.type !== 'object' && value.type !== 'array') {
        zodType = zodType.nullable().optional();
      }

      acc[key] = zodType;
      return acc;
    }, {} as Record<string, any>)
  );

  return tool({
    name: toolDef.function.name,
    description: toolDef.function.description,
    parameters: paramSchema,
    execute: async (params) => {
      try {
        const result = await handler(params, context);
        return JSON.stringify(result);
      } catch (error) {
        return JSON.stringify({
          error: error instanceof Error ? error.message : 'Tool execution failed',
        });
      }
    },
  });
}

/**
 * Create Client AI Agent
 */
export async function createClientAgent(
  supabase: SupabaseClient<Database>,
  clientId: string,
  eventId: string
) {
  // Build context
  const context = await buildClientContext(supabase, clientId, eventId);

  // Generate system prompt
  const instructions = generateClientSystemPrompt(context as any);

  // Convert tools
  const agentContext = { userId: clientId, userType: 'client' as const };
  const tools = clientTools.map(toolDef =>
    convertToAgentTool(
      toolDef,
      clientToolHandlers[toolDef.function.name],
      agentContext
    )
  );

  // Create agent
  const agent = new Agent({
    name: 'Client Assistant',
    model: 'gpt-4o',
    instructions,
    tools,
  });

  return { agent, context };
}

/**
 * Create Venue General AI Agent
 */
export async function createVenueGeneralAgent(
  supabase: SupabaseClient<Database>,
  venueId: string
) {
  // Build context
  const context = await buildVenueGeneralContext(supabase, venueId);

  // Generate system prompt
  const instructions = generateVenueGeneralSystemPrompt(context as any);

  // Convert tools
  const agentContext = { userId: venueId, userType: 'venue' as const };
  const tools = venueGeneralTools.map(toolDef =>
    convertToAgentTool(
      toolDef,
      venueGeneralToolHandlers[toolDef.function.name],
      agentContext
    )
  );

  // Create agent
  const agent = new Agent({
    name: 'Venue Assistant',
    model: 'gpt-4o',
    instructions,
    tools,
  });

  return { agent, context };
}

/**
 * Create Venue Event AI Agent
 */
export async function createVenueEventAgent(
  supabase: SupabaseClient<Database>,
  venueId: string,
  eventId: string
) {
  // Build context
  const context = await buildVenueEventContext(supabase, venueId, eventId);

  // Generate system prompt
  const instructions = generateVenueEventSystemPrompt(context as any);

  // Convert tools
  const agentContext = { userId: venueId, userType: 'venue' as const };
  const tools = venueEventTools.map(toolDef =>
    convertToAgentTool(
      toolDef,
      venueEventToolHandlers[toolDef.function.name],
      agentContext
    )
  );

  // Create agent
  const agent = new Agent({
    name: 'Event Manager',
    model: 'gpt-4o',
    instructions,
    tools,
  });

  return { agent, context };
}

/**
 * Helper to run an agent with a message
 */
export async function runAgent(
  agent: Agent,
  message: string
) {
  const { run } = await import('@openai/agents');

  // Run agent with the message
  const result = await run(agent, message);

  return {
    response: result.finalOutput,
    result,
  };
}
