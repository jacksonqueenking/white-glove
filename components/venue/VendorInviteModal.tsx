'use client';

import { useState } from 'react';
import { Button } from '../shared/Button';
import { FormInput } from '../forms/FormInput';
import { FormTextarea } from '../forms/FormTextarea';
import { FormSelect } from '../forms/FormSelect';

interface VendorInviteModalProps {
  onClose: () => void;
  onInviteSent: () => void;
}

export function VendorInviteModal({ onClose, onInviteSent }: VendorInviteModalProps) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: '',
    personalNote: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);

    try {
      const response = await fetch('/api/venue/invite-vendor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      onInviteSent();
    } catch (err) {
      console.error('Failed to send invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Invite a Vendor</h2>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <FormInput
              label="Vendor Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Bella's Catering"
            />

            <FormInput
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="contact@vendor.com"
            />

            <FormInput
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              placeholder="(555) 123-4567"
            />

            <FormSelect
              label="Services"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              options={[
                { value: '', label: 'Select a category' },
                { value: 'Catering', label: 'Catering' },
                { value: 'Photography', label: 'Photography' },
                { value: 'Videography', label: 'Videography' },
                { value: 'Flowers', label: 'Flowers' },
                { value: 'Music/DJ', label: 'Music/DJ' },
                { value: 'Décor', label: 'Décor' },
                { value: 'Rentals', label: 'Rentals' },
                { value: 'Other', label: 'Other' },
              ]}
            />

            <FormTextarea
              label="Personal Note (optional)"
              value={formData.personalNote}
              onChange={(e) => setFormData({ ...formData, personalNote: e.target.value })}
              rows={3}
              placeholder="Add a personal message to include in the invitation email..."
            />

            <div className="rounded-md bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm text-blue-800">
                An invitation email will be sent to the vendor with instructions to create an
                account and connect with your venue.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={sending}>
              Cancel
            </Button>
            <Button type="submit" disabled={sending}>
              {sending ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
