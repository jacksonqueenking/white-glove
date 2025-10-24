/**
 * Vercel AI SDK Chat Persistence
 *
 * Database operations for persisting Vercel AI SDK chat messages.
 * Based on: https://github.com/vercel-labs/ai-sdk-persistence-db
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/database.types.gen';
import type { UIMessage } from 'ai';
import { nanoid } from 'nanoid';

/**
 * Chat session type
 */
export interface AIChat {
  id: string;
  user_id: string;
  user_type: 'client' | 'venue' | 'vendor';
  agent_type: 'client' | 'venue_general' | 'venue_event';
  event_id?: string;
  venue_id?: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Database message type
 */
interface DBMessage {
  id: string;
  chat_id: string;
  role: string;
  created_at: string;
}

/**
 * Database message part type
 */
interface DBMessagePart {
  id: string;
  message_id: string;
  type: string;
  order: number;
  created_at: string;
  // Text parts
  text_text?: string;
  // Reasoning parts
  reasoning_text?: string;
  // File parts
  file_mediaType?: string;
  file_filename?: string;
  file_url?: string;
  // Source URL parts
  source_url_sourceId?: string;
  source_url_url?: string;
  source_url_title?: string;
  // Source document parts
  source_document_sourceId?: string;
  source_document_mediaType?: string;
  source_document_title?: string;
  source_document_filename?: string;
  // Tool parts
  tool_toolCallId?: string;
  tool_state?: string;
  tool_errorText?: string;
  tool_input?: any;
  tool_output?: any;
  // Custom data parts
  data_content?: any;
  // Provider metadata (lowercase to match database schema)
  providermetadata?: any;
}

/**
 * Create a new chat session
 *
 * @param supabase - Supabase client instance
 * @param params - Chat creation parameters
 * @returns The created chat object
 * @throws {Error} If the database insert fails
 *
 * @example
 * const chat = await createAIChat(supabase, {
 *   id: 'chat-123',
 *   user_id: 'user-uuid',
 *   user_type: 'client',
 *   agent_type: 'client',
 *   event_id: 'event-uuid',
 *   title: 'My Event Planning'
 * });
 */
export async function createAIChat(
  supabase: SupabaseClient<Database>,
  params: {
    id?: string;
    user_id: string;
    user_type: 'client' | 'venue' | 'vendor';
    agent_type: 'client' | 'venue_general' | 'venue_event';
    event_id?: string;
    venue_id?: string;
    title?: string;
  }
): Promise<AIChat> {
  const chatId = params.id || nanoid();

  const { data, error } = await supabase
    .from('ai_chats')
    .insert({
      id: chatId,
      user_id: params.user_id,
      user_type: params.user_type,
      agent_type: params.agent_type,
      event_id: params.event_id,
      venue_id: params.venue_id,
      title: params.title,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create AI chat: ${error.message}`);
  }

  return data as AIChat;
}

/**
 * Get a chat by ID
 *
 * @param supabase - Supabase client instance
 * @param chatId - The chat ID
 * @returns The chat object or null if not found
 * @throws {Error} If the database query fails
 */
export async function getAIChat(
  supabase: SupabaseClient<Database>,
  chatId: string
): Promise<AIChat | null> {
  const { data, error } = await supabase
    .from('ai_chats')
    .select('*')
    .eq('id', chatId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get AI chat: ${error.message}`);
  }

  return data as AIChat;
}

/**
 * Get all chats for a user
 *
 * @param supabase - Supabase client instance
 * @param userId - The user ID
 * @returns Array of chat objects
 * @throws {Error} If the database query fails
 */
export async function getUserAIChats(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<AIChat[]> {
  const { data, error } = await supabase
    .from('ai_chats')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get user AI chats: ${error.message}`);
  }

  return data as AIChat[];
}

/**
 * Map UI message part to database part
 */
function mapPartToDB(part: UIMessage['parts'][number], order: number): Omit<DBMessagePart, 'id' | 'message_id' | 'created_at'> {
  const basePart = {
    type: part.type,
    order,
    providermetadata: (part as any).providerMetadata,
  };

  switch (part.type) {
    case 'text':
      return {
        ...basePart,
        text_text: part.text,
      };

    case 'reasoning':
      return {
        ...basePart,
        reasoning_text: (part as any).text,
      };

    case 'file':
      return {
        ...basePart,
        file_mediaType: (part as any).mimeType,
        file_filename: (part as any).name,
        file_url: (part as any).url,
      };

    case 'tool-call':
      return {
        ...basePart,
        tool_toolCallId: (part as any).toolCallId,
        tool_state: 'call',
        tool_input: (part as any).args,
      };

    case 'tool-result':
      return {
        ...basePart,
        tool_toolCallId: (part as any).toolCallId,
        tool_state: 'result',
        tool_output: (part as any).result,
      };

    case 'dynamic-tool': {
      // Handle dynamic-tool parts from AI SDK
      const toolPart = part as any;
      return {
        ...basePart,
        type: toolPart.state === 'input-available' ? 'tool-call' : 'tool-result',
        tool_toolCallId: toolPart.toolCallId,
        tool_state: toolPart.state,
        tool_errorText: toolPart.errorText,
        tool_input: toolPart.input ? { ...toolPart.input, toolName: toolPart.toolName } : { toolName: toolPart.toolName },
        tool_output: toolPart.output ? { ...toolPart.output, toolName: toolPart.toolName } : undefined,
      };
    }

    default:
      // For custom data parts or unknown types
      return {
        ...basePart,
        data_content: part,
      };
  }
}

/**
 * Map database part to UI message part
 */
function mapPartToUI(dbPart: DBMessagePart): UIMessage['parts'][number] {
  switch (dbPart.type) {
    case 'text':
      return {
        type: 'text',
        text: dbPart.text_text!,
      };

    case 'reasoning':
      return {
        type: 'reasoning',
        text: dbPart.reasoning_text!,
      } as any;

    case 'file':
      return {
        type: 'file',
        mimeType: dbPart.file_mediaType!,
        name: dbPart.file_filename!,
        url: dbPart.file_url!,
      } as any;

    case 'tool-call':
      return {
        type: 'dynamic-tool',
        toolCallId: dbPart.tool_toolCallId!,
        toolName: (dbPart.tool_input as any)?.toolName || 'unknown',
        state: (dbPart.tool_state as any) || 'input-available' as const,
        input: dbPart.tool_input!,
        errorText: dbPart.tool_errorText,
      };

    case 'tool-result':
      return {
        type: 'dynamic-tool',
        toolCallId: dbPart.tool_toolCallId!,
        toolName: (dbPart.tool_output as any)?.toolName || (dbPart.tool_input as any)?.toolName || 'unknown',
        state: (dbPart.tool_state as any) || 'output-available' as const,
        input: dbPart.tool_input || {},
        output: dbPart.tool_output,
        errorText: dbPart.tool_errorText,
      };

    default:
      // Return custom data parts as-is
      return dbPart.data_content || { type: dbPart.type };
  }
}

/**
 * Save or update a message (upsert)
 *
 * @param supabase - Supabase client instance
 * @param chatId - The chat ID
 * @param message - The UI message to save
 * @returns The saved message
 * @throws {Error} If the database operation fails
 *
 * @example
 * await upsertAIMessage(supabase, 'chat-123', {
 *   id: 'msg-123',
 *   role: 'user',
 *   parts: [{ type: 'text', text: 'Hello!' }]
 * });
 */
export async function upsertAIMessage(
  supabase: SupabaseClient<Database>,
  chatId: string,
  message: UIMessage
): Promise<void> {
  // Ensure message has an ID
  const messageId = message.id || nanoid();

  // Insert or update the message
  const { error: messageError } = await supabase
    .from('ai_messages')
    .upsert({
      id: messageId,
      chat_id: chatId,
      role: message.role,
    });

  if (messageError) {
    throw new Error(`Failed to upsert message: ${messageError.message}`);
  }

  // Delete existing parts (for updates)
  const { error: deleteError } = await supabase
    .from('ai_message_parts')
    .delete()
    .eq('message_id', messageId);

  if (deleteError) {
    throw new Error(`Failed to delete message parts: ${deleteError.message}`);
  }

  // Insert new parts
  if (message.parts && message.parts.length > 0) {
    const parts = message.parts.map((part, index) => ({
      id: nanoid(),
      message_id: messageId,
      ...mapPartToDB(part, index),
    }));

    const { error: partsError } = await supabase
      .from('ai_message_parts')
      .insert(parts);

    if (partsError) {
      throw new Error(`Failed to insert message parts: ${partsError.message}`);
    }
  }

  // Update the chat's updated_at timestamp
  await supabase
    .from('ai_chats')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', chatId);
}

/**
 * Load all messages for a chat
 *
 * @param supabase - Supabase client instance
 * @param chatId - The chat ID
 * @returns Array of UI messages
 * @throws {Error} If the database query fails
 *
 * @example
 * const messages = await loadAIChatMessages(supabase, 'chat-123');
 */
export async function loadAIChatMessages(
  supabase: SupabaseClient<Database>,
  chatId: string
): Promise<UIMessage[]> {
  // Get all messages for the chat
  const { data: messages, error: messagesError } = await supabase
    .from('ai_messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    throw new Error(`Failed to load messages: ${messagesError.message}`);
  }

  if (!messages || messages.length === 0) {
    return [];
  }

  // Get all parts for all messages
  const messageIds = messages.map((m) => (m as DBMessage).id);
  const { data: parts, error: partsError } = await supabase
    .from('ai_message_parts')
    .select('*')
    .in('message_id', messageIds)
    .order('order', { ascending: true });

  if (partsError) {
    throw new Error(`Failed to load message parts: ${partsError.message}`);
  }

  // Group parts by message ID
  const partsByMessage = new Map<string, DBMessagePart[]>();
  (parts || []).forEach((part) => {
    const dbPart = part as DBMessagePart;
    if (!partsByMessage.has(dbPart.message_id)) {
      partsByMessage.set(dbPart.message_id, []);
    }
    partsByMessage.get(dbPart.message_id)!.push(dbPart);
  });

  // Map messages to UI format
  return messages.map((message) => {
    const dbMessage = message as DBMessage;
    const messageParts = partsByMessage.get(dbMessage.id) || [];

    return {
      id: dbMessage.id,
      role: dbMessage.role as 'user' | 'assistant' | 'system',
      parts: messageParts.map(mapPartToUI),
    };
  });
}

/**
 * Delete a chat and all its messages
 *
 * @param supabase - Supabase client instance
 * @param chatId - The chat ID
 * @throws {Error} If the database operation fails
 */
export async function deleteAIChat(
  supabase: SupabaseClient<Database>,
  chatId: string
): Promise<void> {
  const { error } = await supabase
    .from('ai_chats')
    .delete()
    .eq('id', chatId);

  if (error) {
    throw new Error(`Failed to delete AI chat: ${error.message}`);
  }
}

/**
 * Delete a message (and all messages after it in the conversation)
 * This implements the "branch deletion" pattern
 *
 * @param supabase - Supabase client instance
 * @param messageId - The message ID to delete (along with all subsequent messages)
 * @throws {Error} If the database operation fails
 */
export async function deleteAIMessage(
  supabase: SupabaseClient<Database>,
  messageId: string
): Promise<void> {
  // Get the message to find its chat and timestamp
  const { data: message, error: getError } = await supabase
    .from('ai_messages')
    .select('chat_id, created_at')
    .eq('id', messageId)
    .single();

  if (getError) {
    throw new Error(`Failed to get message: ${getError.message}`);
  }

  if (!message) {
    return; // Message doesn't exist, nothing to delete
  }

  const dbMessage = message as DBMessage;

  // Delete this message and all messages created after it in the same chat
  const { error: deleteError } = await supabase
    .from('ai_messages')
    .delete()
    .eq('chat_id', dbMessage.chat_id)
    .gte('created_at', dbMessage.created_at);

  if (deleteError) {
    throw new Error(`Failed to delete messages: ${deleteError.message}`);
  }
}

/**
 * Update chat title
 *
 * @param supabase - Supabase client instance
 * @param chatId - The chat ID
 * @param title - The new title
 * @throws {Error} If the database operation fails
 */
export async function updateAIChatTitle(
  supabase: SupabaseClient<Database>,
  chatId: string,
  title: string
): Promise<void> {
  const { error } = await supabase
    .from('ai_chats')
    .update({ title })
    .eq('id', chatId);

  if (error) {
    throw new Error(`Failed to update chat title: ${error.message}`);
  }
}
