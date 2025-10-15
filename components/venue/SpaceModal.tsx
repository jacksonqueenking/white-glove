'use client';

import { useState, useEffect } from 'react';
import { Button } from '../shared/Button';
import { FormInput } from '../forms/FormInput';
import { FormTextarea } from '../forms/FormTextarea';
import { createSpace, updateSpace, deleteSpace } from '../../lib/db/spaces';
import { createClient } from '../../lib/supabase/client';
import type { Space } from '../../lib/schemas';

interface SpaceModalProps {
  space: Space | null;
  venueId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function SpaceModal({ space, venueId, onClose, onSaved }: SpaceModalProps) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: space?.name || '',
    description: space?.description || '',
    capacity: space?.capacity?.toString() || '',
    main_image_url: space?.main_image_url || '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const spaceData = {
        venue_id: venueId,
        name: formData.name,
        description: formData.description || undefined,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        main_image_url: formData.main_image_url || undefined,
      };

      if (space) {
        // Update existing space
        await updateSpace(supabase, space.space_id, spaceData);
      } else {
        // Create new space
        await createSpace(supabase, spaceData);
      }

      onSaved();
    } catch (err) {
      console.error('Failed to save space:', err);
      setError(err instanceof Error ? err.message : 'Failed to save space');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!space) return;

    const confirmed = confirm(
      `Are you sure you want to delete "${space.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    try {
      const supabase = createClient();
      await deleteSpace(supabase, space.space_id);
      onSaved();
    } catch (err) {
      console.error('Failed to delete space:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete space');
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
              {space ? `Edit Space: ${space.name}` : 'Create New Space'}
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
              label="Space Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Main Ballroom"
            />

            <FormTextarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Describe this space, its features, and ideal use cases..."
            />

            <FormInput
              label="Capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              placeholder="150"
              min="1"
            />

            <FormInput
              label="Main Image URL"
              value={formData.main_image_url}
              onChange={(e) => setFormData({ ...formData, main_image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />

            <div className="rounded-md bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm text-blue-800">
                Photo gallery and floor plan uploads will be available in a future update.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 flex justify-between">
            <div>
              {space && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleDelete}
                  disabled={deleting || saving}
                  className="text-red-600 hover:bg-red-50"
                >
                  {deleting ? 'Deleting...' : 'Delete Space'}
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
