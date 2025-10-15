'use client';

import { useState, useEffect } from 'react';
import { Button } from '../shared/Button';
import { OfferingCard } from './OfferingCard';
import { OfferingModal } from './OfferingModal';
import { useCurrentUser } from '../../lib/hooks/useCurrentUser';
import { getVenueElements } from '../../lib/db/elements';
import { getVenueVendors } from '../../lib/db/venue_vendors';
import { createClient } from '../../lib/supabase/client';
import type { Element } from '../../lib/schemas';

export function OfferingsManager() {
  const { user, loading: userLoading } = useCurrentUser();
  const [offerings, setOfferings] = useState<Element[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffering, setEditingOffering] = useState<Element | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [venueVendorId, setVenueVendorId] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && user) {
      loadOfferings();
    }
  }, [userLoading, user]);

  async function loadOfferings() {
    try {
      if (!user || user.type !== 'venue' || !user.venueId) {
        setLoading(false);
        return;
      }

      const supabase = createClient();

      // Get the venue's own venue_vendor relationship (where venue is both venue and vendor)
      const venueVendors = await getVenueVendors(supabase, user.venueId);
      const ownVenueVendor = venueVendors.find((vv) => vv.vendor_id === user.venueId);

      if (ownVenueVendor) {
        setVenueVendorId(ownVenueVendor.venue_vendor_id);
      }

      // Load all elements for this venue
      const elements = await getVenueElements(supabase, user.venueId);

      // Filter to only show venue's own offerings (not from other vendors)
      const venueOfferings = elements.filter(
        (el: any) => el.venue_vendors?.vendor_id === user.venueId
      );

      setOfferings(venueOfferings);
    } catch (err) {
      console.error('Failed to load offerings:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleNewOffering() {
    setEditingOffering(null);
    setModalOpen(true);
  }

  function handleEditOffering(offering: Element) {
    setEditingOffering(offering);
    setModalOpen(true);
  }

  function handleModalClose() {
    setModalOpen(false);
    setEditingOffering(null);
  }

  function handleOfferingSaved() {
    setModalOpen(false);
    setEditingOffering(null);
    loadOfferings();
  }

  const categories = ['all', ...new Set(offerings.map((o) => o.category).filter(Boolean))];
  const filteredOfferings =
    categoryFilter === 'all'
      ? offerings
      : offerings.filter((o) => o.category === categoryFilter);

  // Group offerings by category
  const offeringsByCategory = filteredOfferings.reduce((acc, offering) => {
    const category = offering.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(offering);
    return acc;
  }, {} as Record<string, Element[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600">Loading offerings...</div>
      </div>
    );
  }

  return (
    <>
      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex items-center justify-between gap-4">
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

          <Button onClick={handleNewOffering}>+ New Offering</Button>
        </div>
      </div>

      {/* Offerings List */}
      {offerings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No offerings yet</h3>
          <p className="text-sm text-slate-600 mb-6">
            Add your first service or offering to start building your event packages.
          </p>
          <Button onClick={handleNewOffering}>+ Add Your First Offering</Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(offeringsByCategory).map(([category, categoryOfferings]) => (
            <div key={category}>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">{category}</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryOfferings.map((offering) => (
                  <OfferingCard
                    key={offering.element_id}
                    offering={offering}
                    onEdit={handleEditOffering}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && venueVendorId && (
        <OfferingModal
          offering={editingOffering}
          venueVendorId={venueVendorId}
          onClose={handleModalClose}
          onSaved={handleOfferingSaved}
        />
      )}
    </>
  );
}
