'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TaskListView } from '@/components/tasks/TaskListView';
import { createClient } from '@/lib/supabase/client';

interface Task {
  id: string;
  title: string;
  eventName: string;
  eventId: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: string;
  description?: string;
}

// Client tasks dashboard for managing event to-dos.
export default function ClientTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch tasks for this client with event details
      const { data: tasksData, error } = await supabase
        .from('tasks')
        .select(`
          *,
          events (
            event_id,
            name
          )
        `)
        .eq('assigned_to_id', user.id)
        .eq('assigned_to_type', 'client')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading tasks:', error);
        return;
      }

      // Transform tasks to the format expected by TaskListView
      const transformedTasks = tasksData?.map((task) => ({
        id: task.task_id,
        title: task.name,
        eventName: (task.events as any)?.name || 'Event',
        eventId: task.event_id || '',
        priority: task.priority as 'low' | 'normal' | 'high' | 'urgent',
        status: task.status as 'pending' | 'in_progress' | 'completed',
        dueDate: task.due_date
          ? `Due ${new Date(task.due_date).toLocaleDateString()}`
          : 'No due date',
        description: task.description,
      })) || [];

      setTasks(transformedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkComplete(taskId: string) {
    try {
      const supabase = createClient();

      await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('task_id', taskId);

      await loadTasks();
    } catch (error) {
      console.error('Error marking task complete:', error);
    }
  }

  function handleViewEvent(eventId: string) {
    if (eventId) {
      router.push(`/client/events/${eventId}`);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f0bda4] mx-auto"></div>
          <p className="mt-4 text-[#6f6453]">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <TaskListView
      tasks={tasks}
      mode="client"
      onMarkComplete={handleMarkComplete}
      onViewEvent={handleViewEvent}
    />
  );
}
