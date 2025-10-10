// Mirror the core database entities outlined in docs/schema.md for type safety.
export interface Client {
  client_id: string;
  name: string;
  email: string;
  phone: string;
}

export interface Venue {
  venue_id: string;
  name: string;
  description: string;
}

export interface Vendor {
  vendor_id: string;
  name: string;
  email: string;
}

export interface Event {
  event_id: string;
  name: string;
  date: string;
  client_id: string;
  venue_id: string;
  status: string;
}
