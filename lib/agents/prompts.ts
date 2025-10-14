/**
 * System Prompt Generators for AI Agents
 *
 * Agent Types:
 * - Client Agent: Helps clients plan their event
 * - Venue General Agent: Manages venue-wide operations (all events, vendors)
 * - Venue Event Agent: Manages a specific event in detail
 * - Vendor Context: For generating suggestions for vendors (no AI assistant)
 */

import type { Event, Task, EventElement, Guest, Message, ActionHistory } from '../schemas';

interface ElementOffering {
  element_id: string;
  name: string;
  category: string;
  price: number;
  vendor_name: string;
  vendor_id: string;
  description?: string;
}

interface VendorInfo {
  vendor_id: string;
  name: string;
  approval_status: string;
  element_count: number;
}

/**
 * Generate system prompt for Client AI Assistant
 */
export function generateClientSystemPrompt(context: {
  client: {
    client_id: string;
    name: string;
    email: string;
    phone: string;
    preferences?: any;
  };
  event: Event;
  venue: {
    venue_id: string;
    name: string;
    description?: string;
    address: any;
  };
  eventElements: Array<EventElement & { element: any; vendor_name: string }>;
  tasks: Task[];
  guests: Guest[];
  actionHistory: ActionHistory[];
  availableOfferings: ElementOffering[];
  currentDateTime: string;
}): string {
  const { client, event, venue, eventElements, tasks, guests, actionHistory, availableOfferings, currentDateTime } = context;

  const offeringsByCategory: Record<string, ElementOffering[]> = {};
  availableOfferings.forEach(o => {
    if (!offeringsByCategory[o.category]) offeringsByCategory[o.category] = [];
    offeringsByCategory[o.category].push(o);
  });

  const clientTasks = tasks.filter(t => t.assigned_to_type === 'client');
  const otherTasks = tasks.filter(t => t.assigned_to_type !== 'client');

  const guestStats = {
    total: guests.length,
    confirmed: guests.filter(g => g.rsvp_status === 'yes').length,
    declined: guests.filter(g => g.rsvp_status === 'no').length,
    pending: guests.filter(g => g.rsvp_status === 'undecided').length,
  };

  return `# You are ${client.name}'s Event Planning Assistant

## Your Role
Friendly, proactive AI assistant helping ${client.name} plan their event at ${venue.name}.

## Current Date/Time
${currentDateTime}

## Event: ${event.name}
- Date: ${event.date}
- Status: ${event.status}
- Venue: ${venue.name}

## Selected Elements (${eventElements.length})
${eventElements.map(ee => `- ${ee.element.name} by ${ee.vendor_name} ($${ee.amount}) - ${ee.status}`).join('\n')}

## Your Tasks (${clientTasks.length})
${clientTasks.map(t => `- ${t.name} [${t.priority}] - ${t.status}`).join('\n')}

## Tasks in Others' Courts (${otherTasks.length})
${otherTasks.map(t => `- ${t.name} (${t.assigned_to_type})`).join('\n')}

## Guests (${guestStats.total} total: ${guestStats.confirmed} confirmed, ${guestStats.pending} pending)

## Available Offerings
${Object.entries(offeringsByCategory).map(([cat, items]) => `**${cat}:** ${items.length} options`).join('\n')}

## Recent Activity
${actionHistory.slice(0, 30).map(a => `- ${a.description}`).join('\n')}

You can: answer questions, add elements, manage guests, complete tasks, send messages to venue. Be warm, transparent about costs, confirm major changes.`;
}

/**
 * Generate system prompt for Venue General AI Assistant (venue-wide)
 */
export function generateVenueGeneralSystemPrompt(context: {
  venue: {
    venue_id: string;
    name: string;
    description?: string;
    address: any;
  };
  allEvents: Event[];
  allTasks: Task[];
  allMessages: Message[];
  actionHistory: ActionHistory[];
  allOfferings: ElementOffering[];
  vendors: VendorInfo[];
  currentDateTime: string;
}): string {
  const { venue, allEvents, allTasks, allMessages, vendors, currentDateTime } = context;

  const eventsByStatus: Record<string, number> = {};
  allEvents.forEach(e => {
    eventsByStatus[e.status] = (eventsByStatus[e.status] || 0) + 1;
  });

  const taskStats = {
    pending: allTasks.filter(t => t.status === 'pending').length,
    overdue: allTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length,
  };

  const unread = allMessages.filter(m => !m.read && m.recipient_type === 'venue').length;

  return `# General AI Assistant for ${venue.name}

## Your Scope
Venue-wide assistant for high-level operations. For detailed event work, direct staff to open the specific event (Event Agent).

## Current Date/Time
${currentDateTime}

## Events (${allEvents.length} total)
${Object.entries(eventsByStatus).map(([status, count]) => `- ${status}: ${count}`).join('\n')}

## Tasks: ${taskStats.pending} pending, ${taskStats.overdue} overdue
## Messages: ${unread} unread
## Vendors: ${vendors.length} (${vendors.filter(v => v.approval_status === 'approved').length} approved)

## Recent Activity
${context.actionHistory.slice(0, 20).map(a => `- ${a.description}`).join('\n')}

You handle: event overviews, vendor management, venue-wide messaging, analytics. Direct to Event Agent for: element management, guest lists, detailed coordination.`;
}

/**
 * Generate system prompt for Venue Event AI Assistant (event-specific)
 */
export function generateVenueEventSystemPrompt(context: {
  venue: {
    venue_id: string;
    name: string;
    description: string;
  };
  event: Event;
  client: {
    client_id: string;
    name: string;
    email: string;
    preferences?: any;
  };
  eventElements: Array<EventElement & { element: any; vendor_name: string }>;
  tasks: Task[];
  guests: Guest[];
  messages: Message[];
  actionHistory: ActionHistory[];
  availableOfferings: ElementOffering[];
  currentDateTime: string;
}): string {
  const { venue, event, client, eventElements, tasks, guests, messages, actionHistory, currentDateTime } = context;

  const venueTasks = tasks.filter(t => t.assigned_to_type === 'venue');
  const clientTasks = tasks.filter(t => t.assigned_to_type === 'client');
  const vendorTasks = tasks.filter(t => t.assigned_to_type === 'vendor');

  const guestStats = {
    total: guests.length,
    confirmed: guests.filter(g => g.rsvp_status === 'yes').length,
  };

  const unread = messages.filter(m => !m.read && m.recipient_type === 'venue').length;

  const elementTotal = eventElements.reduce((sum, ee) => sum + ee.amount, 0);

  return `# Event Manager AI for: ${event.name}

## Your Role
Dedicated assistant for THIS EVENT at ${venue.name}. Full control over all event details.

## Current Date/Time
${currentDateTime}

## Event Details
- Client: ${client.name} (${client.email})
- Date: ${event.date}
- Status: ${event.status}
${client.preferences ? `- Preferences: ${JSON.stringify(client.preferences)}` : ''}

## Elements (${eventElements.length}, $${elementTotal.toFixed(2)})
${eventElements.map(ee => `- ${ee.element.name} by ${ee.vendor_name} ($${ee.amount}) - ${ee.status}`).join('\n')}

## Tasks
- Venue: ${venueTasks.length}
- Client: ${clientTasks.length}
- Vendor: ${vendorTasks.length}

## Guests: ${guestStats.total} total, ${guestStats.confirmed} confirmed
## Messages: ${unread} unread

## Recent Activity
${actionHistory.slice(0, 20).map(a => `- ${a.description}`).join('\n')}

You can: update event status/details, manage elements, create tasks, send messages, manage guests, coordinate vendors. Ensure every detail is perfect for ${client.name}'s event!`;
}

/**
 * Generate context for Vendor Interface (no AI assistant)
 */
export function generateVendorContextPrompt(context: {
  vendor: {
    vendor_id: string;
    name: string;
    email: string;
    phone_number: string;
    description: string;
  };
  vendorEvents: Event[];
  vendorTasks: Task[];
  vendorMessages: Message[];
  vendorElements: ElementOffering[];
  actionHistory: ActionHistory[];
  currentDateTime: string;
}): string {
  const { vendor, vendorEvents, vendorTasks, vendorMessages, currentDateTime } = context;

  const unread = vendorMessages.filter(m => !m.read).length;
  const pending = vendorTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;

  return `# Vendor Context: ${vendor.name}

## Current Date/Time
${currentDateTime}

## Events: ${vendorEvents.length}
## Pending Tasks: ${pending}
## Messages: ${vendorMessages.length} total, ${unread} unread

Vendors have simplified access: view/respond to messages, complete tasks, view event specs. No AI assistant.`;
}
