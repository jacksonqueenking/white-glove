'use client';

/**
 * Hook to get current user information
 * Uses Supabase auth to determine the current user and their type
 */

import { useEffect, useState } from 'react';
import { createClient } from '../supabase/client';

export interface CurrentUser {
  id: string;
  email: string;
  type: 'client' | 'venue' | 'vendor';
  venueId?: string;
  clientId?: string;
  vendorId?: string;
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient();
        const { data: { user: authUser }, error } = await supabase.auth.getUser();

        if (error || !authUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Check which table the user exists in
        // Use maybeSingle() instead of single() to handle "not found" gracefully
        // Note: venues table uses venue_id (references auth.users.id), not email
        const [clientRes, venueRes, vendorRes] = await Promise.all([
          supabase.from('clients').select('client_id').eq('email', authUser.email!).maybeSingle(),
          supabase.from('venues').select('venue_id').eq('venue_id', authUser.id).maybeSingle(),
          supabase.from('vendors').select('vendor_id').eq('email', authUser.email!).maybeSingle(),
        ]);

        if (clientRes.data) {
          setUser({
            id: clientRes.data.client_id,
            email: authUser.email!,
            type: 'client',
            clientId: clientRes.data.client_id,
          });
        } else if (venueRes.data) {
          setUser({
            id: venueRes.data.venue_id,
            email: authUser.email!,
            type: 'venue',
            venueId: venueRes.data.venue_id,
          });
        } else if (vendorRes.data) {
          setUser({
            id: vendorRes.data.vendor_id,
            email: authUser.email!,
            type: 'vendor',
            vendorId: vendorRes.data.vendor_id,
          });
        } else {
          setUser(null);
        }

        setLoading(false);
      } catch (error) {
        console.error('Failed to load current user:', error);
        setUser(null);
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  return { user, loading };
}
