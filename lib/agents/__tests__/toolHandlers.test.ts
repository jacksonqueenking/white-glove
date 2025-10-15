/**
 * Tests for Tool Execution Handlers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  executeToolCall,
  clientToolHandlers,
  venueEventToolHandlers,
} from '../toolHandlers';

// Test UUIDs
const TEST_IDS = {
  client: '550e8400-e29b-41d4-a716-446655440001',
  venue: '550e8400-e29b-41d4-a716-446655440002',
  event: '550e8400-e29b-41d4-a716-446655440003',
  element: '550e8400-e29b-41d4-a716-446655440004',
  task: '550e8400-e29b-41d4-a716-446655440005',
  guest: '550e8400-e29b-41d4-a716-446655440006',
};

// Mock all database modules
vi.mock('../../db/elements');
vi.mock('../../db/event_elements');
vi.mock('../../db/guests');
vi.mock('../../db/tasks');
vi.mock('../../db/messages');
vi.mock('../../db/events');
vi.mock('../../supabase/client');

import { getElement, isElementAvailable } from '../../db/elements';
import { addElementToEvent } from '../../db/event_elements';
import { createGuest, updateGuest, deleteGuest } from '../../db/guests';
import { getTask, createTask, completeTask } from '../../db/tasks';
import { sendMessage } from '../../db/messages';
import { getEvent } from '../../db/events';
import { createClient } from '../../supabase/client';

// Mock createClient to return a supabase client mock
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
};

vi.mocked(createClient).mockReturnValue(mockSupabase as any);

describe('Client Tool Handlers', () => {
  const mockContext = {
    userId: TEST_IDS.client,
    userType: 'client' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('get_element_details', () => {
    it('should return element details', async () => {
      const mockElement = {
        element_id: TEST_IDS.element,
        name: 'Premium Catering',
        price: 5000,
        description: 'High-end catering service',
      };

      vi.mocked(getElement).mockResolvedValue(mockElement as any);

      const result = await clientToolHandlers.get_element_details(
        { element_id: TEST_IDS.element },
        mockContext
      );

      expect(result).toEqual(mockElement);
      expect(getElement).toHaveBeenCalledWith(TEST_IDS.element);
    });

    it('should throw error for invalid UUID', async () => {
      await expect(
        clientToolHandlers.get_element_details(
          { element_id: 'invalid' },
          mockContext
        )
      ).rejects.toThrow();
    });
  });

  describe('add_element_to_event', () => {
    it('should add element to client\'s event', async () => {
      const mockEvent = {
        event_id: TEST_IDS.event,
        client_id: TEST_IDS.client,
        venue_id: TEST_IDS.venue,
        date: '2025-06-15T14:00:00Z',
      };

      const mockElement = {
        element_id: TEST_IDS.element,
        price: 5000,
      };

      const mockEventElement = {
        event_element_id: 'ee-123',
        event_id: TEST_IDS.event,
        element_id: TEST_IDS.element,
        amount: 5000,
        status: 'to-do',
      };

      vi.mocked(getEvent).mockResolvedValue(mockEvent as any);
      vi.mocked(getElement).mockResolvedValue(mockElement as any);
      vi.mocked(isElementAvailable).mockResolvedValue(true);
      vi.mocked(addElementToEvent).mockResolvedValue(mockEventElement as any);

      const result = await clientToolHandlers.add_element_to_event(
        {
          event_id: TEST_IDS.event,
          element_id: TEST_IDS.element,
          customization: 'Extra vegetables',
        },
        mockContext
      );

      expect(result).toEqual(mockEventElement);
      expect(addElementToEvent).toHaveBeenCalledWith({
        event_id: TEST_IDS.event,
        element_id: TEST_IDS.element,
        amount: 5000,
        status: 'to-do',
        customization: 'Extra vegetables',
        contract_completed: false,
      });
    });

    it('should throw error if client does not own event', async () => {
      const mockEvent = {
        event_id: TEST_IDS.event,
        client_id: 'other-client',
        venue_id: TEST_IDS.venue,
      };

      vi.mocked(getEvent).mockResolvedValue(mockEvent as any);

      await expect(
        clientToolHandlers.add_element_to_event(
          {
            event_id: TEST_IDS.event,
            element_id: TEST_IDS.element,
          },
          mockContext
        )
      ).rejects.toThrow('Unauthorized');
    });

    it('should throw error if element not available', async () => {
      const mockEvent = {
        event_id: TEST_IDS.event,
        client_id: TEST_IDS.client,
        date: '2025-06-15T14:00:00Z',
      };

      const mockElement = {
        element_id: TEST_IDS.element,
        price: 5000,
      };

      vi.mocked(getEvent).mockResolvedValue(mockEvent as any);
      vi.mocked(getElement).mockResolvedValue(mockElement as any);
      vi.mocked(isElementAvailable).mockResolvedValue(false);

      await expect(
        clientToolHandlers.add_element_to_event(
          {
            event_id: TEST_IDS.event,
            element_id: TEST_IDS.element,
          },
          mockContext
        )
      ).rejects.toThrow('Element is not available for this date');
    });
  });

  describe('add_guest', () => {
    it('should add guest to client\'s event', async () => {
      const mockEvent = {
        event_id: TEST_IDS.event,
        client_id: TEST_IDS.client,
      };

      const mockGuest = {
        guest_id: 'guest-123',
        event_id: TEST_IDS.event,
        name: 'Jane Doe',
        email: 'jane@example.com',
        rsvp_status: 'undecided',
      };

      vi.mocked(getEvent).mockResolvedValue(mockEvent as any);
      vi.mocked(createGuest).mockResolvedValue(mockGuest as any);

      const result = await clientToolHandlers.add_guest(
        {
          event_id: TEST_IDS.event,
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
        mockContext
      );

      expect(result).toEqual(mockGuest);
      expect(createGuest).toHaveBeenCalledWith({
        event_id: TEST_IDS.event,
        name: 'Jane Doe',
        email: 'jane@example.com',
        rsvp_status: 'undecided',
        plus_one: false,
      });
    });
  });

  describe('complete_task', () => {
    it('should complete task assigned to client', async () => {
      const mockTask = {
        task_id: TEST_IDS.task,
        assigned_to_id: TEST_IDS.client,
        assigned_to_type: 'client',
        name: 'Confirm guest count',
      };

      const mockCompletedTask = {
        ...mockTask,
        status: 'completed',
        completed_at: '2025-01-15T10:00:00Z',
      };

      vi.mocked(getTask).mockResolvedValue(mockTask as any);
      vi.mocked(completeTask).mockResolvedValue(mockCompletedTask as any);

      const result = await clientToolHandlers.complete_task(
        {
          task_id: TEST_IDS.task,
          form_response: { guest_count: 150 },
        },
        mockContext
      );

      expect(result).toEqual(mockCompletedTask);
      expect(completeTask).toHaveBeenCalledWith(
        TEST_IDS.task,
        { guest_count: 150 },
        TEST_IDS.client,
        'client'
      );
    });

    it('should throw error if task not assigned to client', async () => {
      const mockTask = {
        task_id: TEST_IDS.task,
        assigned_to_id: 'other-client',
        assigned_to_type: 'client',
      };

      vi.mocked(getTask).mockResolvedValue(mockTask as any);

      await expect(
        clientToolHandlers.complete_task(
          { task_id: TEST_IDS.task },
          mockContext
        )
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('send_message_to_venue', () => {
    it('should send message to venue for client\'s event', async () => {
      const mockEvent = {
        event_id: TEST_IDS.event,
        client_id: TEST_IDS.client,
        venue_id: TEST_IDS.venue,
      };

      const mockMessage = {
        message_id: 'msg-123',
        thread_id: 'event-event-123',
        content: 'Can we change the menu?',
      };

      vi.mocked(getEvent).mockResolvedValue(mockEvent as any);
      vi.mocked(sendMessage).mockResolvedValue(mockMessage as any);

      const result = await clientToolHandlers.send_message_to_venue(
        {
          event_id: TEST_IDS.event,
          content: 'Can we change the menu?',
          action_required: true,
        },
        mockContext
      );

      expect(result).toEqual(mockMessage);
      expect(sendMessage).toHaveBeenCalledWith({
        thread_id: 'event-event-123',
        event_id: TEST_IDS.event,
        sender_id: TEST_IDS.client,
        sender_type: 'client',
        recipient_id: TEST_IDS.venue,
        recipient_type: 'venue',
        content: 'Can we change the menu?',
        attachments: [],
        action_required: true,
        read: false,
      });
    });
  });
});

describe('Venue Event Tool Handlers', () => {
  const mockContext = {
    userId: TEST_IDS.venue,
    userType: 'venue' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create_task', () => {
    it('should create task for venue\'s event', async () => {
      const mockEvent = {
        event_id: TEST_IDS.event,
        venue_id: TEST_IDS.venue,
      };

      const mockTask = {
        task_id: TEST_IDS.task,
        event_id: TEST_IDS.event,
        name: 'Confirm catering',
        assigned_to_id: 'vendor-123',
        assigned_to_type: 'vendor',
      };

      vi.mocked(getEvent).mockResolvedValue(mockEvent as any);
      vi.mocked(createTask).mockResolvedValue(mockTask as any);

      const result = await venueEventToolHandlers.create_task(
        {
          event_id: TEST_IDS.event,
          assigned_to_id: 'vendor-123',
          assigned_to_type: 'vendor',
          name: 'Confirm catering',
          description: 'Please confirm availability for this date',
          priority: 'high',
        },
        mockContext
      );

      expect(result).toEqual(mockTask);
      expect(createTask).toHaveBeenCalledWith({
        event_id: TEST_IDS.event,
        assigned_to_id: 'vendor-123',
        assigned_to_type: 'vendor',
        name: 'Confirm catering',
        description: 'Please confirm availability for this date',
        priority: 'high',
        status: 'pending',
        created_by: TEST_IDS.venue,
      });
    });

    it('should throw error if venue does not own event', async () => {
      const mockEvent = {
        event_id: TEST_IDS.event,
        venue_id: 'other-venue',
      };

      vi.mocked(getEvent).mockResolvedValue(mockEvent as any);

      await expect(
        venueEventToolHandlers.create_task(
          {
            event_id: TEST_IDS.event,
            assigned_to_id: 'vendor-123',
            assigned_to_type: 'vendor',
            name: 'Test task',
            description: 'Test',
          },
          mockContext
        )
      ).rejects.toThrow('Unauthorized');
    });
  });
});

describe('executeToolCall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute client tool successfully', async () => {
    const mockElement = {
      element_id: TEST_IDS.element,
      name: 'Test Element',
    };

    vi.mocked(getElement).mockResolvedValue(mockElement as any);

    const result = await executeToolCall(
      'get_element_details',
      { element_id: TEST_IDS.element },
      { userId: TEST_IDS.client, userType: 'client' },
      'client'
    );

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockElement);
  });

  it('should return error for non-existent tool', async () => {
    const result = await executeToolCall(
      'non_existent_tool',
      {},
      { userId: TEST_IDS.client, userType: 'client' },
      'client'
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Tool not found');
  });

  it('should return error for invalid agent type', async () => {
    const result = await executeToolCall(
      'get_element_details',
      { element_id: TEST_IDS.element },
      { userId: TEST_IDS.client, userType: 'client' },
      'invalid_agent' as any
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unknown agent type');
  });

  it('should catch and return errors from handlers', async () => {
    vi.mocked(getElement).mockRejectedValue(new Error('Database error'));

    const result = await executeToolCall(
      'get_element_details',
      { element_id: TEST_IDS.element },
      { userId: TEST_IDS.client, userType: 'client' },
      'client'
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
  });
});
