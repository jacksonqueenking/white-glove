/**
 * Context Building Functions
 *
 * These functions fetch all necessary data from the database to build
 * complete context for each agent type.
 */

import { getEvent, listEvents } from '../db/events';
import { getClient } from '../db/clients';
import { getVenue } from '../db/venues';
import { listEventElements } from '../db/event_elements';
import { listTasks } from '../db/tasks';
import { listGuests } from '../db/guests';
import { getVenueElements } from '../db/elements';
import { listSpaces } from '../db/spaces';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/database.types.gen';
import { ActionHistorySchema, type ActionHistory } from '../schemas';

/**
 * Build complete context for Client AI Assistant
 */
export async function buildClientContext(
  supabase: SupabaseClient<Database>,
  clientId: string,
  eventId: string
) {

  // Fetch event by ID
  const event = await getEvent(supabase, eventId);
  if (!event) throw new Error('Event not found');

  // Verify client owns this event
  if (event.client_id !== clientId) {
    throw new Error('Client does not have access to this event');
  }

  // Fetch client
  const client = await getClient(supabase, clientId);
  if (!client) throw new Error('Client not found');

  // Fetch venue with detailed error logging
  let venue = null;
  try {
    const { data: venueData, error: venueError } = await supabase
      .from('venues')
      .select('*')
      .eq('venue_id', event.venue_id)
      .is('deleted_at', null)
      .single();

    if (venueError) {
      console.error(`[buildClientContext] Error fetching venue ${event.venue_id}:`, {
        code: venueError.code,
        message: venueError.message,
        details: venueError.details,
        hint: venueError.hint
      });
      throw new Error(`Venue not found: ${venueError.message}`);
    } else if (venueData) {
      venue = venueData as any;
    } else {
      console.error(`[buildClientContext] Venue ${event.venue_id} returned no data (possibly RLS issue)`);
      throw new Error('Venue not found - no data returned (check RLS policies)');
    }
  } catch (error) {
    console.error(`[buildClientContext] Exception fetching venue:`, error);
    throw error;
  }

  // Fetch event elements with element and vendor details
  const eventElements = await listEventElements(supabase, event.event_id);

  // Enrich with full element and vendor info
  const enrichedElements = await Promise.all(
    eventElements.map(async (ee: any) => {
      const { data: element } = await supabase
        .from('elements')
        .select('*, venue_vendors!inner(vendors(name))')
        .eq('element_id', ee.element_id)
        .single();

      return {
        ...ee,
        element: element,
        vendor_name: element?.venue_vendors?.vendors?.name || 'Unknown',
      };
    })
  );

  // Fetch tasks for this event
  const tasks = await listTasks(supabase, { event_id: eventId });

  // Fetch guests
  const guests = await listGuests(supabase, eventId);

  // Fetch action history
  const { data: actionHistory } = await supabase
    .from('action_history')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .limit(30);

  // Parse action history through schema to coerce dates
  const parsedActionHistory = (actionHistory || []).map((item: any) =>
    ActionHistorySchema.parse(item)
  );

  // Fetch available offerings at the venue
  const availableOfferings = await getVenueElements(supabase, event.venue_id);

  // Simplify offerings structure
  const offerings = availableOfferings.map((item: any) => ({
    element_id: item.element_id,
    name: item.name,
    category: item.category,
    price: item.price,
    vendor_name: item.venue_vendors?.vendors?.name || 'Unknown',
    vendor_id: item.venue_vendors?.vendor_id,
    description: item.description,
  }));

  // Fetch spaces
  const spaces = await listSpaces(supabase, event.venue_id);

  // Fetch vendor info - same as venue event context
  const { data: venueVendors } = await supabase
    .from('venue_vendors')
    .select('venue_vendor_id, vendor_id, approval_status, vendors(name), elements(element_id)')
    .eq('venue_id', event.venue_id);

  const vendors = venueVendors?.map((vv: any) => ({
    vendor_id: vv.vendor_id,
    name: vv.vendors?.name || 'Unknown',
    approval_status: vv.approval_status,
    element_count: vv.elements?.length || 0,
  })) || [];

  // Fetch messages for this event
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  return {
    client: {
      client_id: client.client_id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      preferences: client.preferences,
    },
    event,
    venue: {
      venue_id: venue.venue_id,
      name: venue.name,
      description: venue.description,
      address: venue.address,
    },
    eventElements: enrichedElements,
    tasks,
    guests,
    actionHistory: parsedActionHistory,
    availableOfferings: offerings,
    vendors,
    messages: messages || [],
    spaces,
    currentDateTime: new Date().toISOString(),
  };
}

/**
 * Build complete context for Venue General AI Assistant
 */
export async function buildVenueGeneralContext(
  supabase: SupabaseClient<Database>,
  venueId: string
) {

  // Fetch venue
  const venue = await getVenue(supabase, venueId);
  if (!venue) throw new Error('Venue not found');

  // Fetch all events for this venue
  const allEvents = await listEvents(supabase, { venue_id: venueId });

  // Fetch all tasks for all events at this venue
  const allTasks = await listTasks(supabase, { venue_id: venueId } as any);

  // Fetch all messages where venue is sender or recipient
  const { data: allMessages } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${venueId},recipient_id.eq.${venueId}`)
    .order('created_at', { ascending: false })
    .limit(100);

  // Fetch action history across all venue events
  const { data: actionHistory } = await supabase
    .from('action_history')
    .select('*')
    .in('event_id', allEvents.map(e => e.event_id))
    .order('created_at', { ascending: false })
    .limit(50);

  // Parse action history through schema to coerce dates
  const parsedActionHistory = (actionHistory || []).map((item: any) =>
    ActionHistorySchema.parse(item)
  );

  // Fetch all offerings at this venue
  const allOfferings = await getVenueElements(supabase, venueId);

  const offerings = allOfferings.map((item: any) => ({
    element_id: item.element_id,
    name: item.name,
    category: item.category,
    price: item.price,
    vendor_name: item.venue_vendors?.vendors?.name || 'Unknown',
    vendor_id: item.venue_vendors?.vendor_id,
    description: item.description,
  }));

  // Fetch vendor info
  const { data: venueVendors } = await supabase
    .from('venue_vendors')
    .select('venue_vendor_id, vendor_id, approval_status, vendors(name), elements(element_id)')
    .eq('venue_id', venueId);

  const vendors = venueVendors?.map((vv: any) => ({
    vendor_id: vv.vendor_id,
    name: vv.vendors?.name || 'Unknown',
    approval_status: vv.approval_status,
    element_count: vv.elements?.length || 0,
  })) || [];

  // Fetch spaces
  const spaces = await listSpaces(supabase, venueId);

  return {
    venue: {
      venue_id: venue.venue_id,
      name: venue.name,
      description: venue.description,
      address: venue.address,
    },
    allEvents,
    allTasks: allTasks || [],
    allMessages: allMessages || [],
    actionHistory: parsedActionHistory,
    allOfferings: offerings,
    vendors,
    spaces,
    currentDateTime: new Date().toISOString(),
  };
}

/**
 * Build complete context for Venue Event AI Assistant
 */
export async function buildVenueEventContext(
  supabase: SupabaseClient<Database>,
  venueId: string,
  eventId: string
) {

  // Fetch event
  const event = await getEvent(supabase, eventId);
  if (!event) throw new Error('Event not found');

  // Verify event belongs to this venue
  if (event.venue_id !== venueId) {
    throw new Error('Event does not belong to this venue');
  }

  // Fetch venue
  const venue = await getVenue(supabase, venueId);
  if (!venue) throw new Error('Venue not found');

  // Fetch client with detailed error logging
  let client = null;
  if (event.client_id) {
    try {
      // Try to fetch the client directly with error details
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('client_id', event.client_id)
        .is('deleted_at', null)
        .single();

      if (clientError) {
        console.error(`[buildVenueEventContext] Error fetching client ${event.client_id}:`, {
          code: clientError.code,
          message: clientError.message,
          details: clientError.details,
          hint: clientError.hint
        });
      } else if (clientData) {
        client = clientData as any;
      } else {
        console.warn(`[buildVenueEventContext] Client ${event.client_id} returned no data (possibly RLS issue)`);
      }
    } catch (error) {
      console.error(`[buildVenueEventContext] Exception fetching client:`, error);
    }
  } else {
    console.warn(`[buildVenueEventContext] Event ${eventId} has no client_id assigned`);
  }

  // Fetch event elements with details
  const eventElements = await listEventElements(supabase, eventId);

  const enrichedElements = await Promise.all(
    eventElements.map(async (ee: any) => {
      const { data: element } = await supabase
        .from('elements')
        .select('*, venue_vendors!inner(vendors(name))')
        .eq('element_id', ee.element_id)
        .single();

      return {
        ...ee,
        element: element,
        vendor_name: element?.venue_vendors?.vendors?.name || 'Unknown',
      };
    })
  );

  // Fetch tasks
  const tasks = await listTasks(supabase, { event_id: eventId });

  // Fetch guests
  const guests = await listGuests(supabase, eventId);

  // Fetch messages for this event
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  // Fetch action history
  const { data: actionHistory } = await supabase
    .from('action_history')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .limit(30);

  // Parse action history through schema to coerce dates
  const parsedActionHistory = (actionHistory || []).map((item: any) =>
    ActionHistorySchema.parse(item)
  );

  // Fetch available offerings
  const availableOfferings = await getVenueElements(supabase, venueId);

  const offerings = availableOfferings.map((item: any) => ({
    element_id: item.element_id,
    name: item.name,
    category: item.category,
    price: item.price,
    vendor_name: item.venue_vendors?.vendors?.name || 'Unknown',
    vendor_id: item.venue_vendors?.vendor_id,
    description: item.description,
  }));

  // Fetch spaces
  const spaces = await listSpaces(supabase, venueId);

  // Fetch vendor info - same as client context
  const { data: venueVendors } = await supabase
    .from('venue_vendors')
    .select('venue_vendor_id, vendor_id, approval_status, vendors(name), elements(element_id)')
    .eq('venue_id', venueId);

  const vendors = venueVendors?.map((vv: any) => ({
    vendor_id: vv.vendor_id,
    name: vv.vendors?.name || 'Unknown',
    approval_status: vv.approval_status,
    element_count: vv.elements?.length || 0,
  })) || [];

  return {
    venue: {
      venue_id: venue.venue_id,
      name: venue.name,
      description: venue.description,
    },
    event,
    client: client ? {
      client_id: client.client_id,
      name: client.name,
      email: client.email,
      preferences: client.preferences,
    } : null,
    eventElements: enrichedElements,
    tasks,
    guests,
    messages: messages || [],
    actionHistory: parsedActionHistory,
    availableOfferings: offerings,
    vendors,
    spaces,
    currentDateTime: new Date().toISOString(),
  };
}

/**
 * Build context for Vendor Interface
 */
export async function buildVendorContext(
  supabase: SupabaseClient<Database>,
  vendorId: string
) {

  // Fetch vendor
  const { data: vendor } = await supabase
    .from('vendors')
    .select('*')
    .eq('vendor_id', vendorId)
    .single();

  if (!vendor) throw new Error('Vendor not found');

  // Fetch events involving this vendor
  const { data: vendorElements } = await supabase
    .from('event_elements')
    .select('event_id, elements!inner(venue_vendor_id, venue_vendors!inner(vendor_id))')
    .eq('elements.venue_vendors.vendor_id', vendorId);

  const eventIds = Array.from(new Set(vendorElements?.map((ve: any) => ve.event_id) || []));

  const vendorEvents = eventIds.length > 0
    ? await Promise.all(eventIds.map(id => getEvent(supabase, id)))
    : [];

  // Fetch tasks assigned to this vendor
  const vendorTasks = await listTasks(supabase, {
    assigned_to_id: vendorId,
    assigned_to_type: 'vendor',
  });

  // Fetch messages to/from this vendor
  const { data: vendorMessages } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${vendorId},recipient_id.eq.${vendorId}`)
    .order('created_at', { ascending: false });

  // Fetch vendor's elements
  const { data: elements } = await supabase
    .from('elements')
    .select('*, venue_vendors!inner(vendor_id)')
    .eq('venue_vendors.vendor_id', vendorId);

  const vendorElementsList = elements?.map((e: any) => ({
    element_id: e.element_id,
    name: e.name,
    category: e.category,
    price: e.price,
    vendor_name: vendor.name,
    vendor_id: vendorId,
    description: e.description,
  })) || [];

  // Fetch recent action history
  const { data: actionHistory } = await supabase
    .from('action_history')
    .select('*')
    .in('event_id', eventIds)
    .order('created_at', { ascending: false })
    .limit(20);

  // Parse action history through schema to coerce dates
  const parsedActionHistory = (actionHistory || []).map((item: any) =>
    ActionHistorySchema.parse(item)
  );

  return {
    vendor: {
      vendor_id: vendor.vendor_id,
      name: vendor.name,
      email: vendor.email,
      phone_number: vendor.phone_number,
      description: vendor.description,
    },
    vendorEvents: vendorEvents.filter(e => e !== null),
    vendorTasks: vendorTasks || [],
    vendorMessages: vendorMessages || [],
    vendorElements: vendorElementsList,
    actionHistory: parsedActionHistory,
    currentDateTime: new Date().toISOString(),
  };
}
