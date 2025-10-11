/**
 * Task CRUD Operations
 *
 * This module provides database operations for tasks.
 * Tasks are the primary way the AI orchestrator assigns work to users.
 * All functions are designed to be callable by LLM agents as tools.
 */

import { supabase, supabaseAdmin } from './supabaseClient';
import {
  TaskSchema,
  CreateTaskSchema,
  UpdateTaskSchema,
  type Task,
  type CreateTask,
  type UpdateTask,
  type TaskStatus,
  type Priority,
  type UserType,
} from '../schemas';

/**
 * Get a task by ID
 *
 * @param task_id - The UUID of the task to retrieve
 * @returns The task object or null if not found
 * @throws {Error} If the database query fails
 *
 * @example
 * const task = await getTask('task-uuid');
 */
export async function getTask(task_id: string): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('task_id', task_id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to fetch task: ${error.message}`);
  }

  return TaskSchema.parse(data);
}

/**
 * List tasks with optional filtering
 *
 * @param params - Filter parameters
 * @param params.assigned_to_id - Filter by assigned user ID
 * @param params.assigned_to_type - Filter by assigned user type
 * @param params.event_id - Filter by event ID
 * @param params.status - Filter by task status
 * @param params.priority - Filter by priority
 * @param params.include_completed - Include completed tasks (default: false)
 * @param params.limit - Maximum number of tasks to return (default: 50)
 * @returns Array of tasks
 * @throws {Error} If the database query fails
 *
 * @example
 * const tasks = await listTasks({
 *   assigned_to_id: 'user-uuid',
 *   assigned_to_type: 'client',
 *   status: 'pending'
 * });
 */
export async function listTasks(params?: {
  assigned_to_id?: string;
  assigned_to_type?: UserType;
  event_id?: string;
  status?: TaskStatus;
  priority?: Priority;
  include_completed?: boolean;
  limit?: number;
}): Promise<Task[]> {
  let query = supabase
    .from('tasks')
    .select('*')
    .order('priority', { ascending: false })
    .order('due_date', { ascending: true, nullsFirst: false });

  if (params?.assigned_to_id) {
    query = query.eq('assigned_to_id', params.assigned_to_id);
  }

  if (params?.assigned_to_type) {
    query = query.eq('assigned_to_type', params.assigned_to_type);
  }

  if (params?.event_id) {
    query = query.eq('event_id', params.event_id);
  }

  if (params?.status) {
    query = query.eq('status', params.status);
  } else if (!params?.include_completed) {
    // By default, exclude completed tasks
    query = query.neq('status', 'completed');
  }

  if (params?.priority) {
    query = query.eq('priority', params.priority);
  }

  if (params?.limit) {
    query = query.limit(params.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list tasks: ${error.message}`);
  }

  return data?.map((task) => TaskSchema.parse(task)) || [];
}

/**
 * Create a new task
 *
 * This is the primary function the AI orchestrator uses to assign work to users.
 * It automatically creates a notification for the assigned user.
 *
 * @param task - The task data to create
 * @returns The created task object
 * @throws {Error} If validation fails or database insert fails
 *
 * @example
 * const task = await createTask({
 *   event_id: 'event-uuid',
 *   assigned_to_id: 'user-uuid',
 *   assigned_to_type: 'client',
 *   name: 'Confirm guest count',
 *   description: 'Please provide the final guest count for your event',
 *   priority: 'high',
 *   due_date: '2025-06-01T23:59:59Z',
 *   created_by: 'orchestrator'
 * });
 */
export async function createTask(task: CreateTask): Promise<Task> {
  // Validate input
  const validated = CreateTaskSchema.parse(task);

  const { data, error } = await supabase
    .from('tasks')
    .insert(validated)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }

  const createdTask = TaskSchema.parse(data);

  // Create notification for assigned user (using admin client)
  await supabaseAdmin.from('notifications').insert({
    user_id: createdTask.assigned_to_id,
    user_type: createdTask.assigned_to_type,
    notification_type: 'task_created',
    title: 'New Task Assigned',
    content: createdTask.name,
    action_url: `/events/${createdTask.event_id}/tasks/${createdTask.task_id}`,
  });

  return createdTask;
}

/**
 * Update an existing task
 *
 * @param task_id - The UUID of the task to update
 * @param updates - The fields to update
 * @returns The updated task object
 * @throws {Error} If validation fails or database update fails
 *
 * @example
 * const updated = await updateTask('task-uuid', {
 *   status: 'in_progress'
 * });
 */
export async function updateTask(
  task_id: string,
  updates: UpdateTask
): Promise<Task> {
  // Validate input
  const validated = UpdateTaskSchema.parse(updates);

  const { data, error } = await supabase
    .from('tasks')
    .update(validated)
    .eq('task_id', task_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update task: ${error.message}`);
  }

  return TaskSchema.parse(data);
}

/**
 * Complete a task
 *
 * This marks a task as completed and optionally stores the form response.
 * It automatically logs the completion to action_history.
 *
 * @param task_id - The UUID of the task to complete
 * @param form_response - Optional form response data
 * @param user_id - The ID of the user completing the task
 * @param user_type - The type of user completing the task
 * @returns The completed task object
 * @throws {Error} If task update fails
 *
 * @example
 * const completed = await completeTask('task-uuid', {
 *   guest_count: 150,
 *   dietary_notes: 'Several vegetarian guests'
 * }, 'user-uuid', 'client');
 */
export async function completeTask(
  task_id: string,
  form_response: any,
  user_id: string,
  user_type: UserType
): Promise<Task> {
  const updates: UpdateTask = {
    status: 'completed',
    form_response,
  };

  const { data, error } = await supabase
    .from('tasks')
    .update({
      ...updates,
      completed_at: new Date().toISOString(),
    })
    .eq('task_id', task_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to complete task: ${error.message}`);
  }

  const completedTask = TaskSchema.parse(data);

  // Log the completion (using admin client)
  await supabaseAdmin.from('action_history').insert({
    event_id: completedTask.event_id,
    user_id,
    user_type,
    action_type: 'task_completed',
    description: `Task completed: ${completedTask.name}`,
    metadata: {
      task_id,
      form_response,
    },
  });

  return completedTask;
}

/**
 * Cancel a task
 *
 * @param task_id - The UUID of the task to cancel
 * @param reason - Optional reason for cancellation
 * @returns The cancelled task object
 * @throws {Error} If task update fails
 *
 * @example
 * await cancelTask('task-uuid', 'Client already provided this information');
 */
export async function cancelTask(
  task_id: string,
  reason?: string
): Promise<Task> {
  return updateTask(task_id, { status: 'cancelled' });
}

/**
 * Get overdue tasks
 *
 * Returns tasks that are past their due date and not completed.
 *
 * @param assigned_to_id - Optional: filter by specific user
 * @returns Array of overdue tasks
 * @throws {Error} If database query fails
 *
 * @example
 * const overdue = await getOverdueTasks('user-uuid');
 */
export async function getOverdueTasks(
  assigned_to_id?: string
): Promise<Task[]> {
  const now = new Date().toISOString();

  let query = supabase
    .from('tasks')
    .select('*')
    .lt('due_date', now)
    .neq('status', 'completed')
    .neq('status', 'cancelled')
    .order('due_date', { ascending: true });

  if (assigned_to_id) {
    query = query.eq('assigned_to_id', assigned_to_id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get overdue tasks: ${error.message}`);
  }

  return data?.map((task) => TaskSchema.parse(task)) || [];
}

/**
 * Get tasks due soon
 *
 * Returns tasks due within the next N hours that are not completed.
 *
 * @param hours - Number of hours to look ahead (default: 24)
 * @param assigned_to_id - Optional: filter by specific user
 * @returns Array of tasks due soon
 * @throws {Error} If database query fails
 *
 * @example
 * const dueSoon = await getTasksDueSoon(48, 'user-uuid');
 */
export async function getTasksDueSoon(
  hours: number = 24,
  assigned_to_id?: string
): Promise<Task[]> {
  const now = new Date();
  const future = new Date(now.getTime() + hours * 60 * 60 * 1000);

  let query = supabase
    .from('tasks')
    .select('*')
    .gte('due_date', now.toISOString())
    .lte('due_date', future.toISOString())
    .neq('status', 'completed')
    .neq('status', 'cancelled')
    .order('due_date', { ascending: true });

  if (assigned_to_id) {
    query = query.eq('assigned_to_id', assigned_to_id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get tasks due soon: ${error.message}`);
  }

  return data?.map((task) => TaskSchema.parse(task)) || [];
}

/**
 * Get task statistics for a user
 *
 * Returns counts of tasks by status for a user.
 *
 * @param assigned_to_id - The user ID
 * @param assigned_to_type - The user type
 * @returns Object with task counts by status
 * @throws {Error} If database query fails
 *
 * @example
 * const stats = await getTaskStats('user-uuid', 'client');
 * // Returns: { pending: 5, in_progress: 2, completed: 10, overdue: 1 }
 */
export async function getTaskStats(
  assigned_to_id: string,
  assigned_to_type: UserType
): Promise<{
  pending: number;
  in_progress: number;
  completed: number;
  overdue: number;
}> {
  const { data, error } = await supabase
    .from('tasks')
    .select('status, due_date')
    .eq('assigned_to_id', assigned_to_id)
    .eq('assigned_to_type', assigned_to_type);

  if (error) {
    throw new Error(`Failed to get task stats: ${error.message}`);
  }

  const now = new Date();
  const stats = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0,
  };

  data?.forEach((task) => {
    if (task.status === 'completed') {
      stats.completed++;
    } else if (task.status === 'in_progress') {
      stats.in_progress++;
    } else if (task.status === 'pending') {
      stats.pending++;
    }

    // Check if overdue
    if (
      task.status !== 'completed' &&
      task.status !== 'cancelled' &&
      task.due_date &&
      new Date(task.due_date) < now
    ) {
      stats.overdue++;
    }
  });

  return stats;
}
