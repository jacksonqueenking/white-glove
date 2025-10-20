/**
 * ChatKit Store Implementation for Supabase
 *
 * Implements the data storage interface required by the ChatKit protocol.
 * Based on: https://github.com/openai/chatkit-python/blob/main/docs/server.md
 */

import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ChatKitThread {
  thread_id: string;
  user_id: string;
  user_type: 'client' | 'venue' | 'vendor';
  event_id?: string | null;
  venue_id?: string | null;
  agent_type: 'client' | 'venue_general' | 'venue_event';
  title?: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface ChatKitThreadItem {
  item_id: string;
  thread_id: string;
  item_type: 'message' | 'widget' | 'client_tool_call' | 'client_tool_result' | 'hidden';
  role?: 'user' | 'assistant' | 'system' | null;
  content: Record<string, any>;
  status?: 'in_progress' | 'completed' | 'failed' | 'cancelled' | null;
  metadata: Record<string, any>;
  sequence_number: number;
  created_at: string;
  deleted_at?: string | null;
}

export interface ChatKitAttachment {
  attachment_id: string;
  thread_id: string;
  item_id?: string | null;
  filename: string;
  mime_type: string;
  file_size: number;
  storage_path: string;
  storage_url?: string | null;
  uploaded_by: string;
  upload_status: 'pending' | 'uploading' | 'completed' | 'failed';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface ThreadMetadata {
  user_id: string;
  user_type: 'client' | 'venue' | 'vendor';
  agent_type: 'client' | 'venue_general' | 'venue_event';
  event_id?: string;
  venue_id?: string;
  [key: string]: any;
}

// ============================================================================
// CHATKIT STORE CLASS
// ============================================================================

export class ChatKitStore {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Generate a new thread ID
   */
  async generateThreadId(): Promise<string> {
    const { data, error } = await this.supabase.rpc('generate_chatkit_thread_id');
    if (error) throw new Error(`Failed to generate thread ID: ${error.message}`);
    return data as string;
  }

  /**
   * Generate a new item ID
   */
  async generateItemId(): Promise<string> {
    const { data, error } = await this.supabase.rpc('generate_chatkit_item_id');
    if (error) throw new Error(`Failed to generate item ID: ${error.message}`);
    return data as string;
  }

  /**
   * Generate a new attachment ID
   */
  async generateAttachmentId(): Promise<string> {
    const { data, error } = await this.supabase.rpc('generate_chatkit_attachment_id');
    if (error) throw new Error(`Failed to generate attachment ID: ${error.message}`);
    return data as string;
  }

  /**
   * Get next sequence number for a thread
   */
  async getNextSequenceNumber(threadId: string): Promise<number> {
    const { data, error } = await this.supabase.rpc('get_next_sequence_number', {
      p_thread_id: threadId,
    });
    if (error) throw new Error(`Failed to get sequence number: ${error.message}`);
    return data as number;
  }

  // ==========================================================================
  // THREAD OPERATIONS
  // ==========================================================================

  /**
   * Load a thread by ID
   */
  async loadThread(threadId: string): Promise<ChatKitThread | null> {
    const { data, error } = await this.supabase
      .from('chatkit_threads')
      .select('*')
      .eq('thread_id', threadId)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to load thread: ${error.message}`);
    }

    return data as ChatKitThread;
  }

  /**
   * Create a new thread
   */
  async createThread(metadata: ThreadMetadata): Promise<ChatKitThread> {
    const threadId = await this.generateThreadId();

    const thread: Partial<ChatKitThread> = {
      thread_id: threadId,
      user_id: metadata.user_id,
      user_type: metadata.user_type,
      agent_type: metadata.agent_type,
      event_id: metadata.event_id || null,
      venue_id: metadata.venue_id || null,
      title: metadata.title || 'New conversation',
      metadata: metadata,
    };

    const { data, error } = await this.supabase
      .from('chatkit_threads')
      .insert(thread)
      .select()
      .single();

    if (error) throw new Error(`Failed to create thread: ${error.message}`);

    return data as ChatKitThread;
  }

  /**
   * Update a thread
   */
  async updateThread(
    threadId: string,
    updates: Partial<Pick<ChatKitThread, 'title' | 'metadata'>>
  ): Promise<ChatKitThread> {
    const { data, error } = await this.supabase
      .from('chatkit_threads')
      .update(updates)
      .eq('thread_id', threadId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update thread: ${error.message}`);

    return data as ChatKitThread;
  }

  /**
   * Delete a thread (soft delete)
   */
  async deleteThread(threadId: string): Promise<void> {
    const { error } = await this.supabase
      .from('chatkit_threads')
      .update({ deleted_at: new Date().toISOString() })
      .eq('thread_id', threadId);

    if (error) throw new Error(`Failed to delete thread: ${error.message}`);
  }

  /**
   * List threads for a user
   */
  async listThreads(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      eventId?: string;
      venueId?: string;
    }
  ): Promise<ChatKitThread[]> {
    let query = this.supabase
      .from('chatkit_threads')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (options?.eventId) {
      query = query.eq('event_id', options.eventId);
    }

    if (options?.venueId) {
      query = query.eq('venue_id', options.venueId);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to list threads: ${error.message}`);

    return data as ChatKitThread[];
  }

  // ==========================================================================
  // THREAD ITEM OPERATIONS
  // ==========================================================================

  /**
   * Load thread items
   */
  async loadThreadItems(
    threadId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<ChatKitThreadItem[]> {
    let query = this.supabase
      .from('chatkit_thread_items')
      .select('*')
      .eq('thread_id', threadId)
      .is('deleted_at', null)
      .order('sequence_number', { ascending: true });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to load thread items: ${error.message}`);

    return data as ChatKitThreadItem[];
  }

  /**
   * Add an item to a thread
   */
  async addThreadItem(
    threadId: string,
    item: Omit<ChatKitThreadItem, 'item_id' | 'thread_id' | 'sequence_number' | 'created_at'>
  ): Promise<ChatKitThreadItem> {
    const itemId = await this.generateItemId();
    const sequenceNumber = await this.getNextSequenceNumber(threadId);

    const newItem: Partial<ChatKitThreadItem> = {
      item_id: itemId,
      thread_id: threadId,
      sequence_number: sequenceNumber,
      ...item,
    };

    const { data, error } = await this.supabase
      .from('chatkit_thread_items')
      .insert(newItem)
      .select()
      .single();

    if (error) throw new Error(`Failed to add thread item: ${error.message}`);

    // Update thread's updated_at timestamp
    await this.supabase
      .from('chatkit_threads')
      .update({ updated_at: new Date().toISOString() })
      .eq('thread_id', threadId);

    return data as ChatKitThreadItem;
  }

  /**
   * Update a thread item
   */
  async updateThreadItem(
    itemId: string,
    updates: Partial<Pick<ChatKitThreadItem, 'content' | 'status' | 'metadata'>>
  ): Promise<ChatKitThreadItem> {
    const { data, error } = await this.supabase
      .from('chatkit_thread_items')
      .update(updates)
      .eq('item_id', itemId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update thread item: ${error.message}`);

    return data as ChatKitThreadItem;
  }

  /**
   * Delete a thread item (soft delete)
   */
  async deleteThreadItem(itemId: string): Promise<void> {
    const { error } = await this.supabase
      .from('chatkit_thread_items')
      .update({ deleted_at: new Date().toISOString() })
      .eq('item_id', itemId);

    if (error) throw new Error(`Failed to delete thread item: ${error.message}`);
  }

  // ==========================================================================
  // ATTACHMENT OPERATIONS
  // ==========================================================================

  /**
   * Create an attachment
   */
  async createAttachment(
    threadId: string,
    attachment: Omit<ChatKitAttachment, 'attachment_id' | 'created_at' | 'updated_at'>
  ): Promise<ChatKitAttachment> {
    const attachmentId = await this.generateAttachmentId();

    const newAttachment: Partial<ChatKitAttachment> = {
      attachment_id: attachmentId,
      thread_id: threadId,
      ...attachment,
    };

    const { data, error } = await this.supabase
      .from('chatkit_attachments')
      .insert(newAttachment)
      .select()
      .single();

    if (error) throw new Error(`Failed to create attachment: ${error.message}`);

    return data as ChatKitAttachment;
  }

  /**
   * Update attachment status
   */
  async updateAttachment(
    attachmentId: string,
    updates: Partial<Pick<ChatKitAttachment, 'upload_status' | 'storage_url' | 'metadata'>>
  ): Promise<ChatKitAttachment> {
    const { data, error } = await this.supabase
      .from('chatkit_attachments')
      .update(updates)
      .eq('attachment_id', attachmentId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update attachment: ${error.message}`);

    return data as ChatKitAttachment;
  }

  /**
   * Delete an attachment
   */
  async deleteAttachment(attachmentId: string): Promise<void> {
    const { error } = await this.supabase
      .from('chatkit_attachments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('attachment_id', attachmentId);

    if (error) throw new Error(`Failed to delete attachment: ${error.message}`);
  }

  /**
   * Load attachments for a thread
   */
  async loadAttachments(threadId: string): Promise<ChatKitAttachment[]> {
    const { data, error } = await this.supabase
      .from('chatkit_attachments')
      .select('*')
      .eq('thread_id', threadId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to load attachments: ${error.message}`);

    return data as ChatKitAttachment[];
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a ChatKit store instance
 */
export async function createChatKitStore(): Promise<ChatKitStore> {
  const supabase = await createClient();
  return new ChatKitStore(supabase);
}
