'use client';

import { useState, useEffect } from 'react';
import { Button } from '../shared/Button';
import { VendorCard } from './VendorCard';
import { VendorInviteModal } from './VendorInviteModal';
import { useCurrentUser } from '../../lib/hooks/useCurrentUser';
import { getVenueVendors, getVenueVendorElementsCount } from '../../lib/db/venue_vendors';
import { createClient } from '../../lib/supabase/client';

interface VendorData {
  vendor_id: string;
  name: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  coi_expires?: string;
  offerings_count: number;
  active_events: number;
  category: string;
}

export function VendorsManager() {
  const { user, loading: userLoading } = useCurrentUser();
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!userLoading && user) {
      loadVendors();
    }
  }, [userLoading, user]);

  async function loadVendors() {
    try {
      if (!user || user.type !== 'venue' || !user.venueId) {
        setLoading(false);
        return;
      }

      const supabase = createClient();

      const venueVendors = await getVenueVendors(supabase, user.venueId);

      // Transform the data
      const vendorData: VendorData[] = await Promise.all(
        venueVendors.map(async (vv: any) => {
          const offeringsCount = await getVenueVendorElementsCount(supabase, vv.venue_vendor_id);

          // Get COI expiration if exists
          const latestCoi = vv.cois && vv.cois.length > 0 ? vv.cois[0] : null;
          const coiExpires = latestCoi
            ? new Date(latestCoi.expires_at).toLocaleDateString('en-US', {
                month: '2-digit',
                year: 'numeric',
              })
            : undefined;

          return {
            vendor_id: vv.vendor_id,
            name: vv.vendors?.name || 'Unknown',
            approval_status: vv.approval_status === 'n/a' ? 'approved' : vv.approval_status,
            coi_expires: coiExpires,
            offerings_count: offeringsCount,
            active_events: 0, // TODO: Calculate from events
            category: 'General', // TODO: Get from vendor metadata or most common element category
          };
        })
      );

      setVendors(vendorData);
    } catch (err) {
      console.error('Failed to load vendors:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleInviteSent() {
    setInviteModalOpen(false);
    loadVendors();
  }

  const categories = ['all', ...new Set(vendors.map((v) => v.category))];

  const filteredVendors = vendors.filter((vendor) => {
    const matchesCategory = categoryFilter === 'all' || vendor.category === categoryFilter;
    const matchesSearch =
      !searchTerm ||
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.category.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Group vendors by category
  const vendorsByCategory = filteredVendors.reduce((acc, vendor) => {
    if (!acc[vendor.category]) {
      acc[vendor.category] = [];
    }
    acc[vendor.category].push(vendor);
    return acc;
  }, {} as Record<string, VendorData[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600">Loading vendors...</div>
      </div>
    );
  }

  return (
    <>
      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>

          <Button onClick={() => setInviteModalOpen(true)}>+ Invite Vendor</Button>
        </div>
      </div>

      {/* Vendors List */}
      {Object.keys(vendorsByCategory).length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No vendors yet</h3>
          <p className="text-sm text-slate-600 mb-6">
            Start building your vendor network by inviting trusted partners.
          </p>
          <Button onClick={() => setInviteModalOpen(true)}>+ Invite Your First Vendor</Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(vendorsByCategory).map(([category, categoryVendors]) => (
            <div key={category}>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">{category}</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryVendors.map((vendor) => (
                  <VendorCard key={vendor.vendor_id} vendor={vendor} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {inviteModalOpen && (
        <VendorInviteModal
          onClose={() => setInviteModalOpen(false)}
          onInviteSent={handleInviteSent}
        />
      )}
    </>
  );
}
