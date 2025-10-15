'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormInput } from '../forms/FormInput';
import { FormTextarea } from '../forms/FormTextarea';
import { Button } from '../shared/Button';
import { getVenue, updateVenue } from '../../lib/db/venues';
import { useCurrentUser } from '../../lib/hooks/useCurrentUser';
import type { Venue } from '../../lib/schemas';
import { createClient } from '../../lib/supabase/client';

export function VenueProfileForm() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'USA',
    },
  });

  useEffect(() => {
    if (!userLoading) {
      loadVenueData();
    }
  }, [userLoading, user]);

  async function loadVenueData() {
    try {
      if (!user || user.type !== 'venue' || !user.venueId) {
        setError('Not authenticated as a venue');
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const venue = await getVenue(supabase, user.venueId);

      if (venue) {
        setFormData({
          name: venue.name,
          description: venue.description || '',
          address: venue.address,
        });
      }
    } catch (err) {
      console.error('Failed to load venue data:', err);
      setError('Failed to load venue data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      if (!user || !user.venueId) {
        setError('Not authenticated');
        return;
      }

      const supabase = createClient();
      await updateVenue(supabase, user.venueId, {
        name: formData.name,
        description: formData.description,
        address: formData.address,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save venue:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    router.back();
  }

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600">Loading venue data...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white rounded-lg shadow-sm border border-slate-200 p-8">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 border border-green-200 p-4">
          <p className="text-sm text-green-800">Changes saved successfully!</p>
        </div>
      )}

      {/* Business Information */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
          Business Information
        </h2>

        <FormInput
          label="Venue Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="The Grand Ballroom"
        />

        <FormTextarea
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          placeholder="Describe your venue, amenities, and what makes it special..."
        />
      </section>

      {/* Address */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
          Address
        </h2>

        <FormInput
          label="Street Address"
          value={formData.address.street}
          onChange={(e) =>
            setFormData({
              ...formData,
              address: { ...formData.address, street: e.target.value },
            })
          }
          required
          placeholder="123 Main Street"
        />

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="City"
            value={formData.address.city}
            onChange={(e) =>
              setFormData({
                ...formData,
                address: { ...formData.address, city: e.target.value },
              })
            }
            required
            placeholder="San Francisco"
          />

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="State"
              value={formData.address.state}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, state: e.target.value.toUpperCase() },
                })
              }
              required
              maxLength={2}
              placeholder="CA"
            />

            <FormInput
              label="ZIP Code"
              value={formData.address.zip}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, zip: e.target.value },
                })
              }
              required
              placeholder="94102"
            />
          </div>
        </div>
      </section>

      {/* Booking Settings */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
          Booking Settings
        </h2>

        <div className="rounded-md bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm text-blue-800">
            Booking settings (lead time, advance booking limits, etc.) will be available in a future update.
          </p>
        </div>
      </section>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
        <Button
          type="button"
          variant="secondary"
          onClick={handleCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
