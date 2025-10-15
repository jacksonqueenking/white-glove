/**
 * Tests for Context Building Functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  buildClientContext,
  buildVenueGeneralContext,
  buildVenueEventContext,
  buildVendorContext,
} from '../context';

// Mock database functions
vi.mock('../../db/events');
vi.mock('../../db/clients');
vi.mock('../../db/venues');
vi.mock('../../db/event_elements');
vi.mock('../../db/tasks');
vi.mock('../../db/guests');
vi.mock('../../db/messages');
vi.mock('../../db/elements');
vi.mock('../../supabase/client');

import { getEvent, listEvents } from '../../db/events';
import { getClient } from '../../db/clients';
import { getVenue } from '../../db/venues';
import { listEventElements } from '../../db/event_elements';
import { listTasks } from '../../db/tasks';
import { listGuests } from '../../db/guests';
import { getVenueElements } from '../../db/elements';
import { createClient } from '../../supabase/client';

// Mock createClient to return a supabase client mock
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
        order: vi.fn(() => ({
          limit: vi.fn(),
        })),
      })),
      or: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(),
        })),
      })),
      in: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(),
        })),
      })),
    })),
  })),
};

vi.mocked(createClient).mockReturnValue(mockSupabase as any);

describe('buildClientContext', () => {
  const mockClientId = 'client-123';
  const mockEventId = 'event-123';
  const mockVenueId = 'venue-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should build complete client context', async () => {
    // Mock return values
    vi.mocked(getEvent).mockResolvedValue({
      event_id: mockEventId,
      client_id: mockClientId,
      venue_id: mockVenueId,
      name: 'Test Event',
      date: '2025-06-15T14:00:00Z',
      status: 'confirmed',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    } as any);

    vi.mocked(getClient).mockResolvedValue({
      client_id: mockClientId,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-1234',
      preferences: { food: 'vegetarian' },
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    } as any);

    vi.mocked(getVenue).mockResolvedValue({
      venue_id: mockVenueId,
      name: 'Grand Ballroom',
      description: 'Beautiful venue',
      address: { street: '123 Main St', city: 'Boston' },
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    } as any);

    vi.mocked(listEventElements).mockResolvedValue([]);
    vi.mocked(listTasks).mockResolvedValue([]);
    vi.mocked(listGuests).mockResolvedValue([]);
    vi.mocked(getVenueElements).mockResolvedValue([]);

    // Mock supabase queries
    vi.mocked(mockSupabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [] }),
    } as any);

    const context = await buildClientContext(mockClientId, mockEventId);

    expect(context).toHaveProperty('client');
    expect(context).toHaveProperty('event');
    expect(context).toHaveProperty('venue');
    expect(context).toHaveProperty('eventElements');
    expect(context).toHaveProperty('tasks');
    expect(context).toHaveProperty('guests');
    expect(context).toHaveProperty('actionHistory');
    expect(context).toHaveProperty('availableOfferings');
    expect(context).toHaveProperty('currentDateTime');

    expect(context.client.name).toBe('John Doe');
    expect(context.event.name).toBe('Test Event');
    expect(context.venue.name).toBe('Grand Ballroom');
  });

  it('should throw error if event not found', async () => {
    vi.mocked(getEvent).mockResolvedValue(null);

    await expect(buildClientContext(mockClientId, mockEventId)).rejects.toThrow(
      'Event not found'
    );
  });

  it('should throw error if client does not own event', async () => {
    vi.mocked(getEvent).mockResolvedValue({
      event_id: mockEventId,
      client_id: 'other-client',
      venue_id: mockVenueId,
      name: 'Test Event',
      date: '2025-06-15T14:00:00Z',
      status: 'confirmed',
    } as any);

    await expect(buildClientContext(mockClientId, mockEventId)).rejects.toThrow(
      'Client does not have access to this event'
    );
  });
});

describe('buildVenueGeneralContext', () => {
  const mockVenueId = 'venue-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should build complete venue general context', async () => {
    vi.mocked(getVenue).mockResolvedValue({
      venue_id: mockVenueId,
      name: 'Grand Ballroom',
      description: 'Beautiful venue',
      address: { street: '123 Main St' },
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    } as any);

    vi.mocked(listEvents).mockResolvedValue([
      {
        event_id: 'event-1',
        name: 'Event 1',
        status: 'confirmed',
        venue_id: mockVenueId,
      } as any,
    ]);

    vi.mocked(listTasks).mockResolvedValue([]);
    vi.mocked(getVenueElements).mockResolvedValue([]);

    vi.mocked(mockSupabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [] }),
    } as any);

    const context = await buildVenueGeneralContext(mockVenueId);

    expect(context).toHaveProperty('venue');
    expect(context).toHaveProperty('allEvents');
    expect(context).toHaveProperty('allTasks');
    expect(context).toHaveProperty('allMessages');
    expect(context).toHaveProperty('actionHistory');
    expect(context).toHaveProperty('allOfferings');
    expect(context).toHaveProperty('vendors');
    expect(context).toHaveProperty('currentDateTime');

    expect(context.venue.name).toBe('Grand Ballroom');
    expect(context.allEvents.length).toBe(1);
  });
});

describe('buildVenueEventContext', () => {
  const mockVenueId = 'venue-123';
  const mockEventId = 'event-123';
  const mockClientId = 'client-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should build complete venue event context', async () => {
    vi.mocked(getEvent).mockResolvedValue({
      event_id: mockEventId,
      venue_id: mockVenueId,
      client_id: mockClientId,
      name: 'Test Event',
      date: '2025-06-15T14:00:00Z',
      status: 'confirmed',
    } as any);

    vi.mocked(getVenue).mockResolvedValue({
      venue_id: mockVenueId,
      name: 'Grand Ballroom',
      description: 'Beautiful venue',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    } as any);

    vi.mocked(getClient).mockResolvedValue({
      client_id: mockClientId,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-1234',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    } as any);

    vi.mocked(listEventElements).mockResolvedValue([]);
    vi.mocked(listTasks).mockResolvedValue([]);
    vi.mocked(listGuests).mockResolvedValue([]);
    vi.mocked(getVenueElements).mockResolvedValue([]);

    vi.mocked(mockSupabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [] }),
    } as any);

    const context = await buildVenueEventContext(mockVenueId, mockEventId);

    expect(context).toHaveProperty('venue');
    expect(context).toHaveProperty('event');
    expect(context).toHaveProperty('client');
    expect(context).toHaveProperty('eventElements');
    expect(context).toHaveProperty('tasks');
    expect(context).toHaveProperty('guests');
    expect(context).toHaveProperty('messages');
    expect(context).toHaveProperty('actionHistory');
    expect(context).toHaveProperty('availableOfferings');
    expect(context).toHaveProperty('currentDateTime');

    expect(context.event.name).toBe('Test Event');
    expect(context.client?.name).toBe('John Doe');
  });

  it('should throw error if event does not belong to venue', async () => {
    vi.mocked(getEvent).mockResolvedValue({
      event_id: mockEventId,
      venue_id: 'other-venue',
      client_id: mockClientId,
      name: 'Test Event',
    } as any);

    await expect(
      buildVenueEventContext(mockVenueId, mockEventId)
    ).rejects.toThrow('Event does not belong to this venue');
  });
});

describe('buildVendorContext', () => {
  const mockVendorId = 'vendor-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should build complete vendor context', async () => {
    vi.mocked(mockSupabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          vendor_id: mockVendorId,
          name: 'Acme Catering',
          email: 'contact@acme.com',
          phone_number: '555-5678',
          description: 'Premium catering',
        },
      }),
    } as any);

    vi.mocked(getEvent).mockResolvedValue(null);
    vi.mocked(listTasks).mockResolvedValue([]);

    const context = await buildVendorContext(mockVendorId);

    expect(context).toHaveProperty('vendor');
    expect(context).toHaveProperty('vendorEvents');
    expect(context).toHaveProperty('vendorTasks');
    expect(context).toHaveProperty('vendorMessages');
    expect(context).toHaveProperty('vendorElements');
    expect(context).toHaveProperty('actionHistory');
    expect(context).toHaveProperty('currentDateTime');

    expect(context.vendor.name).toBe('Acme Catering');
  });
});
