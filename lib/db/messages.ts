/**
 * Message CRUD Operations
 *
 * This module provides database operations for human-to-human messages.
 * All functions are designed to be callable by LLM agents as tools.
 */

import { supabase, supabaseAdmin } from './supabaseClient';
import {
  MessageSchema,
  CreateMessageSchema,
  type Message,
  type CreateMessage,
  type UserType,
} from '../schemas';

/**
 * Get a message by ID
 *
 * @param message_id - The UUID of the message to retrieve
 * @returns The message object or null if not found
 * @throws {Error} If the database query fails
 *
 * @example
 * const message = await getMessage('message-uuid');
 */
export async function getMessage(message_id: string): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('message_id', message_id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch message: ${error.message}`);
  }

  return MessageSchema.parse(data);
}

/**
 * List messages in a thread
 *
 * @param thread_id - The UUID of the thread
 * @param limit - Maximum number of messages to return (default: 50)
 * @returns Array of messages ordered by creation time
 * @throws {Error} If the database query fails
 *
 * @example
 * const messages = await listMessagesInThread('thread-uuid');
 */
export async function listMessagesInThread(
  thread_id: string,
  limit: number = 50
): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('thread_id', thread_id)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list messages in thread: ${error.message}`);
  }

  return data?.map((message) => MessageSchema.parse(message)) || [];
}

/**
 * Get message threads for a user
 *
 * Returns unique threads where the user is sender or recipient.
 *
 * @param user_id - The UUID of the user
 * @param user_type - The type of user
 * @returns Array of thread IDs with latest message info
 * @throws {Error} If database query fails
 *
 * @example
 * const threads = await getUserMessageThreads('user-uuid', 'client');
 */
export async function getUserMessageThreads(
  user_id: string,
  user_type: UserType
): Promise<any[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('thread_id, event_id, created_at, content, read, sender_id, recipient_id')
    .or(`sender_id.eq.${user_id},recipient_id.eq.${user_id}`)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get user message threads: ${error.message}`);
  }

  // Group by thread_id and get latest message per thread
  const threadsMap = new Map();
  data?.forEach((msg) => {
    if (!threadsMap.has(msg.thread_id) || new Date(msg.created_at) > new Date(threadsMap.get(msg.thread_id).created_at)) {
      threadsMap.set(msg.thread_id, msg);
    }
  });

  return Array.from(threadsMap.values());
}

/**
 * Send a message
 *
 * Creates a new message and sends notification to recipient.
 *
 * @param message - The message data to create
 * @returns The created message object
 * @throws {Error} If validation fails or database insert fails
 *
 * @example
 * const message = await sendMessage({
 *   thread_id: 'thread-uuid',
 *   event_id: 'event-uuid',
 *   sender_id: 'user-uuid',
 *   sender_type: 'venue',
 *   recipient_id: 'client-uuid',
 *   recipient_type: 'client',
 *   content: 'The florist confirmed availability for your date!'
 * });
 */
export async function sendMessage(message: CreateMessage): Promise<Message> {
  const validated = CreateMessageSchema.parse(message);

  const { data, error } = await supabase
    .from('messages')
    .insert(validated)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to send message: ${error.message}`);
  }

  // Create notification for recipient
  await supabaseAdmin.from('notifications').insert({
    user_id: validated.recipient_id,
    user_type: validated.recipient_type,
    notification_type: 'message_received',
    title: 'New Message',
    content: validated.content.substring(0, 100),
    action_url: validated.event_id ? `/events/${validated.event_id}/messages` : '/messages',
  });

  return MessageSchema.parse(data);
}

/**
 * Mark message as read
 *
 * @param message_id - The UUID of the message
 * @returns The updated message
 * @throws {Error} If update fails
 *
 * @example
 * await markMessageAsRead('message-uuid');
 */
export async function markMessageAsRead(message_id: string): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('message_id', message_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to mark message as read: ${error.message}`);
  }

  return MessageSchema.parse(data);
}

/**
 * Mark all messages in a thread as read
 *
 * @param thread_id - The UUID of the thread
 * @param user_id - The ID of the user marking as read
 * @returns Number of messages marked as read
 * @throws {Error} If update fails
 *
 * @example
 * await markThreadAsRead('thread-uuid', 'user-uuid');
 */
export async function markThreadAsRead(thread_id: string, user_id: string): Promise<number> {
  const { count, error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('thread_id', thread_id)
    .eq('recipient_id', user_id)
    .eq('read', false);

  if (error) {
    throw new Error(`Failed to mark thread as read: ${error.message}`);
  }

  return count || 0;
}

/**
 * Get unread message count for a user
 *
 * @param user_id - The UUID of the user
 * @returns Count of unread messages
 * @throws {Error} If database query fails
 *
 * @example
 * const unreadCount = await getUnreadMessageCount('user-uuid');
 */
export async function getUnreadMessageCount(user_id: string): Promise<number> {
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', user_id)
    .eq('read', false);

  if (error) {
    throw new Error(`Failed to get unread message count: ${error.message}`);
  }

  return count || 0;
}

/**
 * Search messages
 *
 * @param user_id - The UUID of the user
 * @param search_term - The search term (matches content)
 * @param limit - Maximum number of results (default: 20)
 * @returns Array of matching messages
 * @throws {Error} If database query fails
 *
 * @example
 * const results = await searchMessages('user-uuid', 'florist');
 */
export async function searchMessages(
  user_id: string,
  search_term: string,
  limit: number = 20
): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${user_id},recipient_id.eq.${user_id}`)
    .ilike('content', `%${search_term}%`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to search messages: ${error.message}`);
  }

  return data?.map((message) => MessageSchema.parse(message)) || [];
}
