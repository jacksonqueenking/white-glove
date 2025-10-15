/**
 * Chat CRUD Operations
 *
 * This module provides database operations for AI assistant chat conversations.
 * All functions are designed to be callable by LLM agents as tools.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/database.types.gen';

/**
 * Get a chat by ID
 *
 * @param supabase - Supabase client instance
 * @param chat_id - The UUID of the chat to retrieve
 * @returns The chat object or null if not found
 * @throws {Error} If the database query fails
 *
 * @example
 * const chat = await getChat(supabase, 'chat-uuid');
 */
export async function getChat(supabase: SupabaseClient<Database>, chat_id: string): Promise<any | null> {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('chat_id', chat_id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch chat: ${error.message}`);
  }

  return data;
}

/**
 * List chats for a user
 *
 * @param supabase - Supabase client instance
 * @param user_id - The UUID of the user
 * @param user_type - The type of user ('client' or 'venue')
 * @param include_archived - Include archived chats (default: false)
 * @returns Array of chats ordered by most recent
 * @throws {Error} If the database query fails
 *
 * @example
 * const chats = await listUserChats(supabase, 'user-uuid', 'client');
 */
export async function listUserChats(
  supabase: SupabaseClient<Database>,
  user_id: string,
  user_type: 'client' | 'venue',
  include_archived: boolean = false
): Promise<any[]> {
  let query = supabase
    .from('chats')
    .select('*')
    .eq('user_id', user_id)
    .eq('user_type', user_type)
    .order('updated_at', { ascending: false });

  if (!include_archived) {
    query = query.eq('archived', false);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list user chats: ${error.message}`);
  }

  return data || [];
}

/**
 * Get chats for an event
 *
 * Returns all chat conversations related to a specific event.
 *
 * @param supabase - Supabase client instance
 * @param event_id - The UUID of the event
 * @returns Array of chats
 * @throws {Error} If the database query fails
 *
 * @example
 * const eventChats = await getEventChats(supabase, 'event-uuid');
 */
export async function getEventChats(supabase: SupabaseClient<Database>, event_id: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('event_id', event_id)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get event chats: ${error.message}`);
  }

  return data || [];
}

/**
 * Create a new chat
 *
 * @param supabase - Supabase client instance
 * @param chat - The chat data to create
 * @returns The created chat object
 * @throws {Error} If database insert fails
 *
 * @example
 * const newChat = await createChat(supabase, {
 *   user_id: 'user-uuid',
 *   user_type: 'client',
 *   event_id: 'event-uuid',
 *   messages: []
 * });
 */
export async function createChat(supabase: SupabaseClient<Database>, chat: {
  user_id: string;
  user_type: 'client' | 'venue';
  event_id?: string;
  messages?: any[];
}): Promise<any> {
  const { data, error } = await supabase
    .from('chats')
    .insert({
      ...chat,
      messages: chat.messages || [],
      archived: false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create chat: ${error.message}`);
  }

  return data;
}

/**
 * Add a message to a chat
 *
 * Appends a new message to the chat's messages array.
 *
 * @param supabase - Supabase client instance
 * @param chat_id - The UUID of the chat
 * @param message - The message to add
 * @returns The updated chat object
 * @throws {Error} If update fails
 *
 * @example
 * await addMessageToChat(supabase, 'chat-uuid', {
 *   role: 'user',
 *   content: 'I need help planning my wedding',
 *   timestamp: new Date().toISOString()
 * });
 */
export async function addMessageToChat(
  supabase: SupabaseClient<Database>,
  chat_id: string,
  message: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    tool_calls?: any[];
  }
): Promise<any> {
  const chat = await getChat(supabase, chat_id);
  if (!chat) {
    throw new Error('Chat not found');
  }

  const messages = [...(chat.messages || []), message];

  const { data, error } = await supabase
    .from('chats')
    .update({
      messages,
      updated_at: new Date().toISOString(),
    })
    .eq('chat_id', chat_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add message to chat: ${error.message}`);
  }

  return data;
}

/**
 * Archive a chat
 *
 * @param supabase - Supabase client instance
 * @param chat_id - The UUID of the chat to archive
 * @returns True if successful
 * @throws {Error} If update fails
 *
 * @example
 * await archiveChat(supabase, 'chat-uuid');
 */
export async function archiveChat(supabase: SupabaseClient<Database>, chat_id: string): Promise<boolean> {
  const { error } = await supabase
    .from('chats')
    .update({ archived: true })
    .eq('chat_id', chat_id);

  if (error) {
    throw new Error(`Failed to archive chat: ${error.message}`);
  }

  return true;
}

/**
 * Unarchive a chat
 *
 * @param supabase - Supabase client instance
 * @param chat_id - The UUID of the chat to unarchive
 * @returns True if successful
 * @throws {Error} If update fails
 *
 * @example
 * await unarchiveChat(supabase, 'chat-uuid');
 */
export async function unarchiveChat(supabase: SupabaseClient<Database>, chat_id: string): Promise<boolean> {
  const { error } = await supabase
    .from('chats')
    .update({ archived: false })
    .eq('chat_id', chat_id);

  if (error) {
    throw new Error(`Failed to unarchive chat: ${error.message}`);
  }

  return true;
}

/**
 * Delete a chat
 *
 * Permanently deletes a chat and all its messages.
 *
 * @param supabase - Supabase client instance
 * @param chat_id - The UUID of the chat to delete
 * @returns True if successful
 * @throws {Error} If delete fails
 *
 * @example
 * await deleteChat(supabase, 'chat-uuid');
 */
export async function deleteChat(supabase: SupabaseClient<Database>, chat_id: string): Promise<boolean> {
  const { error } = await supabase
    .from('chats')
    .delete()
    .eq('chat_id', chat_id);

  if (error) {
    throw new Error(`Failed to delete chat: ${error.message}`);
  }

  return true;
}

/**
 * Get or create a chat for an event
 *
 * Returns existing chat or creates a new one if none exists.
 *
 * @param supabase - Supabase client instance
 * @param user_id - The UUID of the user
 * @param user_type - The type of user
 * @param event_id - The UUID of the event
 * @returns The chat object
 * @throws {Error} If query or insert fails
 *
 * @example
 * const chat = await getOrCreateEventChat(supabase, 'user-uuid', 'client', 'event-uuid');
 */
export async function getOrCreateEventChat(
  supabase: SupabaseClient<Database>,
  user_id: string,
  user_type: 'client' | 'venue',
  event_id: string
): Promise<any> {
  // Try to find existing chat
  const { data: existing, error: queryError } = await supabase
    .from('chats')
    .select('*')
    .eq('user_id', user_id)
    .eq('event_id', event_id)
    .eq('archived', false)
    .single();

  if (existing) {
    return existing;
  }

  // Create new chat if none exists
  return createChat(supabase, {
    user_id,
    user_type,
    event_id,
    messages: [],
  });
}
