'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TaskListView } from '@/components/tasks/TaskListView';
import { InquiryReviewModal } from '@/components/tasks/InquiryReviewModal';
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
  form_schema?: any;
  form_response?: any;
}

interface InquiryData {
  inquiry_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  company_name?: string;
  event_date: string;
  event_time: string;
  event_type?: string;
  space_names: string[];
  guest_count: number;
  budget: number;
  description: string;
  preferred_contact_method?: string;
  created_at: string;
}

export default function VenueTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryData | null>(null);
  const [currentInquiryTaskId, setCurrentInquiryTaskId] = useState<string | null>(null);

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

      // Fetch tasks for this venue with event details
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
        .eq('assigned_to_type', 'venue')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading tasks:', error);
        return;
      }

      // Transform tasks to the format expected by TaskListView
      const transformedTasks = tasksData?.map((task) => ({
        id: task.task_id,
        title: task.name,
        eventName: (task.events as any)?.name || (task.event_id ? 'Event' : 'New Inquiry'),
        eventId: task.event_id || '',
        priority: task.priority as 'low' | 'normal' | 'high' | 'urgent',
        status: task.status as 'pending' | 'in_progress' | 'completed',
        dueDate: task.due_date
          ? `Due ${new Date(task.due_date).toLocaleDateString()}`
          : 'No due date',
        description: task.description,
        form_schema: task.form_schema,
        form_response: task.form_response,
      })) || [];

      setTasks(transformedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleTaskClick(taskId: string) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Check if this is an inquiry review task
    if (task.form_schema?.fields?.find((f: any) => f.id === 'inquiry_id')) {
      // This is an inquiry review task
      const inquiryIdField = task.form_schema.fields.find((f: any) => f.id === 'inquiry_id');
      const inquiryId = inquiryIdField?.value;

      if (inquiryId) {
        await loadInquiryDetails(inquiryId, taskId);
      }
    }
  }

  async function loadInquiryDetails(inquiryId: string, taskId: string) {
    try {
      const supabase = createClient();

      const { data: inquiry, error } = await supabase
        .from('client_inquiries')
        .select('*')
        .eq('inquiry_id', inquiryId)
        .single();

      if (error || !inquiry) {
        console.error('Error loading inquiry:', error);
        alert('Failed to load inquiry details');
        return;
      }

      // Get space names
      const { data: spaces } = await supabase
        .from('spaces')
        .select('name')
        .in('space_id', inquiry.space_ids);

      const spaceNames = spaces?.map(s => s.name) || [];

      setSelectedInquiry({
        inquiry_id: inquiry.inquiry_id,
        client_name: inquiry.client_name,
        client_email: inquiry.client_email,
        client_phone: inquiry.client_phone,
        company_name: inquiry.company_name || undefined,
        event_date: inquiry.event_date,
        event_time: inquiry.event_time,
        event_type: inquiry.event_type || undefined,
        space_names: spaceNames,
        guest_count: inquiry.guest_count,
        budget: inquiry.budget,
        description: inquiry.description,
        preferred_contact_method: inquiry.preferred_contact_method || undefined,
        created_at: inquiry.created_at,
      });
      setCurrentInquiryTaskId(taskId);
    } catch (error) {
      console.error('Error loading inquiry:', error);
      alert('Failed to load inquiry details');
    }
  }

  async function handleApprove(notes?: string) {
    if (!selectedInquiry || !currentInquiryTaskId) return;

    try {
      const supabase = createClient();

      const response = await fetch(`/api/inquiries/${selectedInquiry.inquiry_id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: 'approve',
          venue_notes: notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve inquiry');
      }

      // Mark the task as completed
      await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          form_response: {
            decision: 'approve',
            venue_notes: notes,
          },
        })
        .eq('task_id', currentInquiryTaskId);

      // Reload tasks
      await loadTasks();
      setSelectedInquiry(null);
      setCurrentInquiryTaskId(null);

      alert('Inquiry approved and client notified!');
    } catch (error) {
      console.error('Error approving inquiry:', error);
      throw error;
    }
  }

  async function handleDecline(
    reason: string,
    alternatives?: Array<{ date: string; time: string; notes?: string }>
  ) {
    if (!selectedInquiry || !currentInquiryTaskId) return;

    try {
      const supabase = createClient();

      const response = await fetch(`/api/inquiries/${selectedInquiry.inquiry_id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: 'decline',
          decline_reason: reason,
          alternative_dates: alternatives,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to decline inquiry');
      }

      // Mark the task as completed
      await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          form_response: {
            decision: 'decline',
            decline_reason: reason,
            alternative_dates: alternatives,
          },
        })
        .eq('task_id', currentInquiryTaskId);

      // Reload tasks
      await loadTasks();
      setSelectedInquiry(null);
      setCurrentInquiryTaskId(null);

      alert('Inquiry declined and client notified');
    } catch (error) {
      console.error('Error declining inquiry:', error);
      throw error;
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
      router.push(`/venue/events/${eventId}`);
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
    <>
      <TaskListView
        tasks={tasks}
        mode="venue"
        onTaskClick={handleTaskClick}
        onMarkComplete={handleMarkComplete}
        onViewEvent={handleViewEvent}
      />

      {selectedInquiry && (
        <InquiryReviewModal
          inquiry={selectedInquiry}
          onClose={() => {
            setSelectedInquiry(null);
            setCurrentInquiryTaskId(null);
          }}
          onApprove={handleApprove}
          onDecline={handleDecline}
        />
      )}
    </>
  );
}
