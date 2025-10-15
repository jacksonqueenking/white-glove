/**
 * Notification CRUD Operations
 *
 * This module provides database operations for notifications.
 * All functions are designed to be callable by LLM agents as tools.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/database.types.gen';
import {
  NotificationSchema,
  CreateNotificationSchema,
  type Notification,
  type CreateNotification,
  type UserType,
} from '../schemas';

/**
 * Get a notification by ID
 *
 * @param supabase - Supabase client instance
 * @param notification_id - The UUID of the notification to retrieve
 * @returns The notification object or null if not found
 * @throws {Error} If the database query fails
 *
 * @example
 * const notification = await getNotification(supabase, 'notification-uuid');
 */
export async function getNotification(supabase: SupabaseClient<Database>, notification_id: string): Promise<Notification | null> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('notification_id', notification_id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch notification: ${error.message}`);
  }

  return NotificationSchema.parse(data);
}

/**
 * List notifications for a user
 *
 * @param supabase - Supabase client instance
 * @param user_id - The UUID of the user
 * @param user_type - The type of user
 * @param unread_only - If true, only return unread notifications (default: false)
 * @param limit - Maximum number of notifications to return (default: 50)
 * @returns Array of notifications ordered by most recent
 * @throws {Error} If the database query fails
 *
 * @example
 * const allNotifications = await listNotifications(supabase, 'user-uuid', 'client');
 * const unread = await listNotifications(supabase, 'user-uuid', 'client', true);
 */
export async function listNotifications(
  supabase: SupabaseClient<Database>,
  user_id: string,
  user_type: UserType,
  unread_only: boolean = false,
  limit: number = 50
): Promise<Notification[]> {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user_id)
    .eq('user_type', user_type)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unread_only) {
    query = query.eq('read', false);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list notifications: ${error.message}`);
  }

  return data?.map((notification: any) => NotificationSchema.parse(notification)) || [];
}

/**
 * Create a notification
 *
 * Note: Requires admin privileges to bypass RLS.
 *
 * @param supabase - Supabase client instance (requires admin privileges)
 * @param notification - The notification data to create
 * @returns The created notification object
 * @throws {Error} If validation fails or database insert fails
 *
 * @example
 * const notification = await createNotification(supabaseAdmin, {
 *   user_id: 'user-uuid',
 *   user_type: 'client',
 *   notification_type: 'task_created',
 *   title: 'New Task',
 *   content: 'You have a new task: Confirm guest count'
 * });
 */
export async function createNotification(
  supabase: SupabaseClient<Database>,
  notification: CreateNotification
): Promise<Notification> {
  const validated = CreateNotificationSchema.parse(notification);

  const { data, error } = await supabase
    .from('notifications')
    .insert(validated)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create notification: ${error.message}`);
  }

  return NotificationSchema.parse(data);
}

/**
 * Mark a notification as read
 *
 * @param supabase - Supabase client instance
 * @param notification_id - The UUID of the notification
 * @returns The updated notification
 * @throws {Error} If update fails
 *
 * @example
 * await markNotificationAsRead(supabase, 'notification-uuid');
 */
export async function markNotificationAsRead(
  supabase: SupabaseClient<Database>,
  notification_id: string
): Promise<Notification> {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('notification_id', notification_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to mark notification as read: ${error.message}`);
  }

  return NotificationSchema.parse(data);
}

/**
 * Mark all notifications as read for a user
 *
 * @param supabase - Supabase client instance
 * @param user_id - The UUID of the user
 * @param user_type - The type of user
 * @returns Number of notifications marked as read
 * @throws {Error} If update fails
 *
 * @example
 * const count = await markAllNotificationsAsRead(supabase, 'user-uuid', 'client');
 */
export async function markAllNotificationsAsRead(
  supabase: SupabaseClient<Database>,
  user_id: string,
  user_type: UserType
): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user_id)
    .eq('user_type', user_type)
    .eq('read', false);

  if (error) {
    throw new Error(`Failed to mark all notifications as read: ${error.message}`);
  }

  return count || 0;
}

/**
 * Delete a notification
 *
 * @param supabase - Supabase client instance
 * @param notification_id - The UUID of the notification to delete
 * @returns True if successful
 * @throws {Error} If delete fails
 *
 * @example
 * await deleteNotification(supabase, 'notification-uuid');
 */
export async function deleteNotification(supabase: SupabaseClient<Database>, notification_id: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('notification_id', notification_id);

  if (error) {
    throw new Error(`Failed to delete notification: ${error.message}`);
  }

  return true;
}

/**
 * Get unread notification count
 *
 * @param supabase - Supabase client instance
 * @param user_id - The UUID of the user
 * @param user_type - The type of user
 * @returns Count of unread notifications
 * @throws {Error} If database query fails
 *
 * @example
 * const unreadCount = await getUnreadNotificationCount(supabase, 'user-uuid', 'client');
 */
export async function getUnreadNotificationCount(
  supabase: SupabaseClient<Database>,
  user_id: string,
  user_type: UserType
): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user_id)
    .eq('user_type', user_type)
    .eq('read', false);

  if (error) {
    throw new Error(`Failed to get unread notification count: ${error.message}`);
  }

  return count || 0;
}

/**
 * Delete old read notifications
 *
 * Deletes read notifications older than the specified number of days.
 * Note: Requires admin privileges.
 *
 * @param supabase - Supabase client instance (requires admin privileges)
 * @param days_old - Age in days (default: 30)
 * @returns Number of notifications deleted
 * @throws {Error} If delete fails
 *
 * @example
 * const deleted = await deleteOldNotifications(supabaseAdmin, 90);
 */
export async function deleteOldNotifications(supabase: SupabaseClient<Database>, days_old: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days_old);

  const { count, error } = await supabase
    .from('notifications')
    .delete()
    .eq('read', true)
    .lt('created_at', cutoffDate.toISOString());

  if (error) {
    throw new Error(`Failed to delete old notifications: ${error.message}`);
  }

  return count || 0;
}

/**
 * Bulk create notifications
 *
 * Creates multiple notifications at once (e.g., for broadcasting).
 * Note: Requires admin privileges.
 *
 * @param supabase - Supabase client instance (requires admin privileges)
 * @param notifications - Array of notification data to create
 * @returns Array of created notifications
 * @throws {Error} If validation fails or database insert fails
 *
 * @example
 * await bulkCreateNotifications(supabaseAdmin, [
 *   { user_id: 'user1', user_type: 'client', notification_type: 'event_reminder', title: '...', content: '...' },
 *   { user_id: 'user2', user_type: 'client', notification_type: 'event_reminder', title: '...', content: '...' }
 * ]);
 */
export async function bulkCreateNotifications(
  supabase: SupabaseClient<Database>,
  notifications: CreateNotification[]
): Promise<Notification[]> {
  const validated = notifications.map((n: any) => CreateNotificationSchema.parse(n));

  const { data, error } = await supabase
    .from('notifications')
    .insert(validated)
    .select();

  if (error) {
    throw new Error(`Failed to bulk create notifications: ${error.message}`);
  }

  return data?.map((notification: any) => NotificationSchema.parse(notification)) || [];
}
