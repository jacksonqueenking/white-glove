/**
 * AI Agent Tool Definitions
 *
 * OpenAI-compatible tool definitions for each agent type:
 * - clientTools: For client AI assistant
 * - venueGeneralTools: For venue-wide operations (all events)
 * - venueEventTools: For specific event management
 * - vendorTools: For vendor interface (no AI, but used for suggestions)
 */

export interface OpenAITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required: string[];
      additionalProperties?: boolean;
    };
  };
}

/**
 * CLIENT TOOLS
 *
 * Tools for the client AI assistant to help plan their event.
 */
export const clientTools: OpenAITool[] = [
  {
    type: 'function',
    function: {
      name: 'get_element_details',
      description: 'Get full details of an available offering including description, pricing, and vendor info.',
      parameters: {
        type: 'object',
        properties: {
          element_id: { type: 'string', description: 'Element UUID' },
        },
        required: ['element_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_element_to_event',
      description: 'Add an offering to the client\'s event.',
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'string', description: 'Event UUID' },
          element_id: { type: 'string', description: 'Element UUID' },
          customization: { type: 'string', description: 'Special instructions' },
        },
        required: ['event_id', 'element_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'request_element_change',
      description: 'Request a change to an existing event element (creates task for venue).',
      parameters: {
        type: 'object',
        properties: {
          event_element_id: { type: 'string', description: 'Event element UUID' },
          change_description: { type: 'string', description: 'What needs to change' },
          urgent: { type: 'boolean', description: 'Is this urgent?' },
        },
        required: ['event_element_id', 'change_description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_guest',
      description: 'Add a guest to the event.',
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          dietary_restrictions: { type: 'string' },
          plus_one: { type: 'boolean' },
        },
        required: ['event_id', 'name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_guest',
      description: 'Update a guest\'s information.',
      parameters: {
        type: 'object',
        properties: {
          guest_id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          rsvp_status: { type: 'string', enum: ['yes', 'no', 'undecided'] },
          dietary_restrictions: { type: 'string' },
          plus_one: { type: 'boolean' },
        },
        required: ['guest_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remove_guest',
      description: 'Remove a guest from the event.',
      parameters: {
        type: 'object',
        properties: {
          guest_id: { type: 'string' },
        },
        required: ['guest_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_task_details',
      description: 'Get full task details including form schema.',
      parameters: {
        type: 'object',
        properties: {
          task_id: { type: 'string' },
        },
        required: ['task_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'complete_task',
      description: 'Complete a task with optional form response.',
      parameters: {
        type: 'object',
        properties: {
          task_id: { type: 'string' },
          form_response: { type: 'object' },
        },
        required: ['task_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_message_to_venue',
      description: 'Send a message to the venue.',
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'string' },
          content: { type: 'string' },
          action_required: { type: 'boolean' },
        },
        required: ['event_id', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_available_elements',
      description: 'Search for offerings by category or keyword.',
      parameters: {
        type: 'object',
        properties: {
          venue_id: { type: 'string' },
          category: { type: 'string' },
          search_term: { type: 'string' },
          max_price: { type: 'number' },
        },
        required: ['venue_id'],
      },
    },
  },
];

/**
 * VENUE GENERAL TOOLS
 *
 * For venue-wide operations: managing all events, vendors, and high-level coordination.
 * Does NOT include event-specific element/guest management.
 */
export const venueGeneralTools: OpenAITool[] = [
  {
    type: 'function',
    function: {
      name: 'list_events',
      description: 'List all events with optional filters.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['inquiry', 'pending_confirmation', 'confirmed', 'in_planning', 'finalized', 'completed', 'cancelled'],
          },
          start_date: { type: 'string' },
          end_date: { type: 'string' },
          client_id: { type: 'string' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_event_summary',
      description: 'Get high-level summary of a specific event.',
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'string' },
        },
        required: ['event_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_event',
      description: 'Create a new event.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          date: { type: 'string', description: 'ISO 8601 format' },
          client_id: { type: 'string' },
          venue_id: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['name', 'date', 'venue_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_vendors',
      description: 'List all vendors and their approval status.',
      parameters: {
        type: 'object',
        properties: {
          approval_status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_vendor_approval',
      description: 'Approve or reject a vendor.',
      parameters: {
        type: 'object',
        properties: {
          venue_vendor_id: { type: 'string' },
          approval_status: { type: 'string', enum: ['approved', 'rejected'] },
        },
        required: ['venue_vendor_id', 'approval_status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_element',
      description: 'Create a new offering for the venue.',
      parameters: {
        type: 'object',
        properties: {
          venue_vendor_id: { type: 'string' },
          name: { type: 'string' },
          category: { type: 'string' },
          price: { type: 'number' },
          description: { type: 'string' },
          availability_rules: { type: 'object' },
        },
        required: ['venue_vendor_id', 'name', 'category', 'price', 'description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_element',
      description: 'Update an offering.',
      parameters: {
        type: 'object',
        properties: {
          element_id: { type: 'string' },
          name: { type: 'string' },
          price: { type: 'number' },
          description: { type: 'string' },
        },
        required: ['element_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_message',
      description: 'Send a message to a client or vendor.',
      parameters: {
        type: 'object',
        properties: {
          recipient_id: { type: 'string' },
          recipient_type: { type: 'string', enum: ['client', 'vendor'] },
          content: { type: 'string' },
          event_id: { type: 'string' },
          action_required: { type: 'boolean' },
        },
        required: ['recipient_id', 'recipient_type', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_venue_dashboard',
      description: 'Get dashboard with event counts, task summary, unread messages.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_overdue_tasks',
      description: 'Get all overdue tasks across all events.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
];

/**
 * VENUE EVENT TOOLS
 *
 * For managing a specific event: elements, guests, tasks, coordination.
 */
export const venueEventTools: OpenAITool[] = [
  {
    type: 'function',
    function: {
      name: 'update_event_status',
      description: 'Change the event status (logs the change).',
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'string' },
          new_status: {
            type: 'string',
            enum: ['inquiry', 'pending_confirmation', 'confirmed', 'in_planning', 'finalized', 'completed', 'cancelled'],
          },
        },
        required: ['event_id', 'new_status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_event',
      description: 'Update event details like name, date, description.',
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'string' },
          name: { type: 'string' },
          date: { type: 'string' },
          description: { type: 'string' },
          rsvp_deadline: { type: 'string' },
        },
        required: ['event_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_element_to_event',
      description: 'Add an element to this event.',
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'string' },
          element_id: { type: 'string' },
          amount: { type: 'number' },
          customization: { type: 'string' },
          notes: { type: 'string' },
        },
        required: ['event_id', 'element_id', 'amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_event_element_status',
      description: 'Update an event element status.',
      parameters: {
        type: 'object',
        properties: {
          event_element_id: { type: 'string' },
          new_status: { type: 'string', enum: ['to-do', 'in_progress', 'completed', 'needs_attention'] },
        },
        required: ['event_element_id', 'new_status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_event_element',
      description: 'Update event element details.',
      parameters: {
        type: 'object',
        properties: {
          event_element_id: { type: 'string' },
          customization: { type: 'string' },
          amount: { type: 'number' },
          notes: { type: 'string' },
          contract_completed: { type: 'boolean' },
        },
        required: ['event_element_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remove_element_from_event',
      description: 'Remove an element from the event.',
      parameters: {
        type: 'object',
        properties: {
          event_element_id: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['event_element_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Create a task for client, vendor, or venue staff.',
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'string' },
          assigned_to_id: { type: 'string' },
          assigned_to_type: { type: 'string', enum: ['client', 'venue', 'vendor'] },
          name: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          due_date: { type: 'string' },
          form_schema: { type: 'object' },
        },
        required: ['event_id', 'assigned_to_id', 'assigned_to_type', 'name', 'description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_task',
      description: 'Update a task.',
      parameters: {
        type: 'object',
        properties: {
          task_id: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'cancelled'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          due_date: { type: 'string' },
        },
        required: ['task_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'complete_task',
      description: 'Complete a task.',
      parameters: {
        type: 'object',
        properties: {
          task_id: { type: 'string' },
          form_response: { type: 'object' },
        },
        required: ['task_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_guest',
      description: 'Add a guest to the event.',
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          dietary_restrictions: { type: 'string' },
        },
        required: ['event_id', 'name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_guest',
      description: 'Update guest information.',
      parameters: {
        type: 'object',
        properties: {
          guest_id: { type: 'string' },
          rsvp_status: { type: 'string', enum: ['yes', 'no', 'undecided'] },
          dietary_restrictions: { type: 'string' },
        },
        required: ['guest_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_guest_statistics',
      description: 'Get guest stats for the event.',
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'string' },
        },
        required: ['event_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_message',
      description: 'Send a message to client or vendor.',
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'string' },
          recipient_id: { type: 'string' },
          recipient_type: { type: 'string', enum: ['client', 'vendor'] },
          content: { type: 'string' },
          action_required: { type: 'boolean' },
        },
        required: ['recipient_id', 'recipient_type', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'mark_message_as_read',
      description: 'Mark a message as read.',
      parameters: {
        type: 'object',
        properties: {
          message_id: { type: 'string' },
        },
        required: ['message_id'],
      },
    },
  },
];

/**
 * VENDOR TOOLS
 *
 * Limited tools for vendor interface (no AI assistant).
 */
export const vendorTools: OpenAITool[] = [
  {
    type: 'function',
    function: {
      name: 'get_task_details',
      description: 'Get task details.',
      parameters: {
        type: 'object',
        properties: {
          task_id: { type: 'string' },
        },
        required: ['task_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'complete_task',
      description: 'Complete a task.',
      parameters: {
        type: 'object',
        properties: {
          task_id: { type: 'string' },
          form_response: { type: 'object' },
        },
        required: ['task_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_message_to_venue',
      description: 'Send a message to the venue.',
      parameters: {
        type: 'object',
        properties: {
          thread_id: { type: 'string' },
          content: { type: 'string' },
        },
        required: ['thread_id', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'mark_message_as_read',
      description: 'Mark message as read.',
      parameters: {
        type: 'object',
        properties: {
          message_id: { type: 'string' },
        },
        required: ['message_id'],
      },
    },
  },
];

/**
 * Helper to get tools by user type and context
 */
export function getToolsForAgent(
  agentType: 'client' | 'venue_general' | 'venue_event' | 'vendor'
): OpenAITool[] {
  switch (agentType) {
    case 'client':
      return clientTools;
    case 'venue_general':
      return venueGeneralTools;
    case 'venue_event':
      return venueEventTools;
    case 'vendor':
      return vendorTools;
    default:
      return [];
  }
}
