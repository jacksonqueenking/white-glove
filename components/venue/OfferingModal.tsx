'use client';

import { useState } from 'react';
import { Button } from '../shared/Button';
import { FormInput } from '../forms/FormInput';
import { FormTextarea } from '../forms/FormTextarea';
import { FormSelect } from '../forms/FormSelect';
import { createElement, updateElement, deleteElement } from '../../lib/db/elements';
import { createClient } from '../../lib/supabase/client';
import type { Element } from '../../lib/schemas';

interface OfferingModalProps {
  offering: Element | null;
  venueVendorId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function OfferingModal({ offering, venueVendorId, onClose, onSaved }: OfferingModalProps) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: offering?.name || '',
    category: offering?.category || '',
    price: offering?.price.toString() || '',
    description: offering?.description || '',
    image_url: offering?.image_url || '',
    lead_time_days: offering?.availability_rules.lead_time_days.toString() || '0',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();

      const elementData = {
        venue_vendor_id: venueVendorId,
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        description: formData.description || undefined,
        image_url: formData.image_url || undefined,
        availability_rules: {
          lead_time_days: parseInt(formData.lead_time_days),
        },
      };

      if (offering) {
        // Update existing offering
        await updateElement(supabase, offering.element_id, elementData);
      } else {
        // Create new offering
        await createElement(supabase, elementData);
      }

      onSaved();
    } catch (err) {
      console.error('Failed to save offering:', err);
      setError(err instanceof Error ? err.message : 'Failed to save offering');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!offering) return;

    const confirmed = confirm(
      `Are you sure you want to delete "${offering.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    try {
      const supabase = createClient();
      await deleteElement(supabase, offering.element_id);
      onSaved();
    } catch (err) {
      console.error('Failed to delete offering:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete offering');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">
              {offering ? `Edit Offering: ${offering.name}` : 'Create New Offering'}
            </h2>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <FormInput
              label="Offering Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Main Ballroom Rental"
            />

            <FormSelect
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              options={[
                { value: '', label: 'Select a category' },
                { value: 'Venue Rental', label: 'Venue Rental' },
                { value: 'Equipment', label: 'Equipment' },
                { value: 'Tables & Chairs', label: 'Tables & Chairs' },
                { value: 'Linens & Décor', label: 'Linens & Décor' },
                { value: 'Audio/Visual', label: 'Audio/Visual' },
                { value: 'Catering', label: 'Catering' },
                { value: 'Bar Service', label: 'Bar Service' },
                { value: 'Coordination', label: 'Coordination' },
                { value: 'Setup/Cleanup', label: 'Setup/Cleanup' },
                { value: 'Parking', label: 'Parking' },
                { value: 'Other', label: 'Other' },
              ]}
            />

            <FormInput
              label="Base Price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
              min="0"
              step="0.01"
              placeholder="2500.00"
            />

            <FormTextarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="Describe this offering, what's included, and any important details..."
            />

            <FormInput
              label="Image URL"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />

            <FormInput
              label="Lead Time (days)"
              type="number"
              value={formData.lead_time_days}
              onChange={(e) => setFormData({ ...formData, lead_time_days: e.target.value })}
              min="0"
              placeholder="7"
              help="Minimum days notice required to book this offering"
            />

            <div className="rounded-md bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm text-blue-800">
                Advanced features (seasonal pricing, blackout dates, file attachments) will be
                available in a future update.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 flex justify-between">
            <div>
              {offering && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleDelete}
                  disabled={deleting || saving}
                  className="text-red-600 hover:bg-red-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={saving || deleting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || deleting}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
