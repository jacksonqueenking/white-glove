'use client';

import { useState } from 'react';

interface InquiryReviewModalProps {
  inquiry: {
    inquiry_id: string;
    client_name: string;
    client_email: string;
    client_phone: string;
    company_name?: string;
    event_date: string;
    event_time: string;
    event_type?: string;
    space_names: string[];
    guest_count: number;
    budget: number;
    description: string;
    preferred_contact_method?: string;
    created_at: string;
  };
  onClose: () => void;
  onApprove: (notes?: string) => Promise<void>;
  onDecline: (reason: string, alternatives?: Array<{ date: string; time: string; notes?: string }>) => Promise<void>;
}

export function InquiryReviewModal({
  inquiry,
  onClose,
  onApprove,
  onDecline,
}: InquiryReviewModalProps) {
  const [decision, setDecision] = useState<'approve' | 'decline' | null>(null);
  const [venueNotes, setVenueNotes] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [suggestAlternatives, setSuggestAlternatives] = useState(false);
  const [alternativeDates, setAlternativeDates] = useState<Array<{ date: string; time: string; notes: string }>>([
    { date: '', time: '', notes: '' }
  ]);
  const [submitting, setSubmitting] = useState(false);

  const handleAddAlternative = () => {
    setAlternativeDates([...alternativeDates, { date: '', time: '', notes: '' }]);
  };

  const handleRemoveAlternative = (index: number) => {
    setAlternativeDates(alternativeDates.filter((_, i) => i !== index));
  };

  const handleAlternativeChange = (index: number, field: 'date' | 'time' | 'notes', value: string) => {
    const updated = [...alternativeDates];
    updated[index][field] = value;
    setAlternativeDates(updated);
  };

  const handleSubmit = async () => {
    if (!decision) return;

    if (decision === 'decline' && !declineReason.trim()) {
      alert('Please provide a reason for declining');
      return;
    }

    setSubmitting(true);

    try {
      if (decision === 'approve') {
        await onApprove(venueNotes || undefined);
      } else {
        const validAlternatives = suggestAlternatives
          ? alternativeDates.filter(alt => alt.date && alt.time)
          : undefined;
        await onDecline(declineReason, validAlternatives);
      }
    } catch (error) {
      console.error('Error processing decision:', error);
      alert('Failed to process decision. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-3xl border border-[#e7dfd4] bg-white p-8 shadow-xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-semibold text-[#3f3a33] mb-6">Review Booking Request</h2>

        {/* Client Information */}
        <div className="bg-[#fff8f0] rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#3f3a33] mb-4">Client Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-[#4d463b]">Name</p>
              <p className="text-[#6f6453]">{inquiry.client_name}</p>
            </div>
            <div>
              <p className="font-semibold text-[#4d463b]">Email</p>
              <p className="text-[#6f6453]">{inquiry.client_email}</p>
            </div>
            <div>
              <p className="font-semibold text-[#4d463b]">Phone</p>
              <p className="text-[#6f6453]">{inquiry.client_phone}</p>
            </div>
            {inquiry.company_name && (
              <div>
                <p className="font-semibold text-[#4d463b]">Company</p>
                <p className="text-[#6f6453]">{inquiry.company_name}</p>
              </div>
            )}
            {inquiry.preferred_contact_method && (
              <div>
                <p className="font-semibold text-[#4d463b]">Preferred Contact</p>
                <p className="text-[#6f6453] capitalize">{inquiry.preferred_contact_method}</p>
              </div>
            )}
          </div>
        </div>

        {/* Event Details */}
        <div className="bg-[#f0f7f1] rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#3f3a33] mb-4">Event Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-[#4d463b]">Date & Time</p>
              <p className="text-[#6f6453]">
                {new Date(inquiry.event_date).toLocaleDateString()} at {inquiry.event_time}
              </p>
            </div>
            {inquiry.event_type && (
              <div>
                <p className="font-semibold text-[#4d463b]">Event Type</p>
                <p className="text-[#6f6453]">{inquiry.event_type}</p>
              </div>
            )}
            <div>
              <p className="font-semibold text-[#4d463b]">Guest Count</p>
              <p className="text-[#6f6453]">{inquiry.guest_count} guests</p>
            </div>
            <div>
              <p className="font-semibold text-[#4d463b]">Budget</p>
              <p className="text-[#6f6453]">${inquiry.budget.toLocaleString()}</p>
            </div>
            <div className="md:col-span-2">
              <p className="font-semibold text-[#4d463b]">Requested Spaces</p>
              <p className="text-[#6f6453]">{inquiry.space_names.join(', ')}</p>
            </div>
          </div>
        </div>

        {/* Event Description */}
        <div className="bg-[#fef1e4] rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#3f3a33] mb-2">Event Description</h3>
          <p className="text-sm text-[#6f6453] leading-relaxed">{inquiry.description}</p>
        </div>

        {/* Decision Section */}
        {!decision ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#3f3a33]">Your Decision</h3>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setDecision('approve')}
                className="flex-1 rounded-2xl bg-[#e4f1e6] px-6 py-4 text-center font-semibold text-[#3c8650] transition hover:bg-[#d4e6d6]"
              >
                ✓ Approve Booking
              </button>
              <button
                type="button"
                onClick={() => setDecision('decline')}
                className="flex-1 rounded-2xl bg-[#fde9e1] px-6 py-4 text-center font-semibold text-[#c96f3a] transition hover:bg-[#fcd9cd]"
              >
                ✗ Decline Booking
              </button>
            </div>
          </div>
        ) : decision === 'approve' ? (
          <div className="space-y-4">
            <div className="bg-[#e4f1e6] rounded-2xl p-4">
              <p className="text-sm font-semibold text-[#3c8650]">✓ Approving this booking</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#4d463b] mb-2">
                Notes for Client (Optional)
              </label>
              <textarea
                value={venueNotes}
                onChange={(e) => setVenueNotes(e.target.value)}
                placeholder="Add any notes or instructions for the client..."
                rows={4}
                className="w-full rounded-2xl border border-[#e7dfd4] px-4 py-3 text-sm text-[#3f3a33] focus:border-[#f0bda4] focus:outline-none focus:ring-2 focus:ring-[#f4d8c4]"
              />
              <p className="mt-1 text-xs text-[#a18a72]">
                These notes will be included in the confirmation email
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDecision(null)}
                className="rounded-full border border-[#e7dfd4] px-6 py-2 text-sm font-medium text-[#6f6453] transition hover:bg-[#f1e9df]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-full bg-[#f0bda4] px-6 py-2 text-sm font-semibold text-[#624230] transition hover:bg-[#eba98a] disabled:bg-[#d9c8b5] disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-[#fde9e1] rounded-2xl p-4">
              <p className="text-sm font-semibold text-[#c96f3a]">✗ Declining this booking</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#4d463b] mb-2">
                Reason for Declining <span className="text-red-500">*</span>
              </label>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Explain why this booking cannot be accommodated..."
                rows={4}
                className="w-full rounded-2xl border border-[#e7dfd4] px-4 py-3 text-sm text-[#3f3a33] focus:border-[#f0bda4] focus:outline-none focus:ring-2 focus:ring-[#f4d8c4]"
                required
              />
              <p className="mt-1 text-xs text-[#a18a72]">
                This reason will be sent to the client
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#4d463b]">
                <input
                  type="checkbox"
                  checked={suggestAlternatives}
                  onChange={(e) => setSuggestAlternatives(e.target.checked)}
                  className="rounded border-[#e7dfd4]"
                />
                Suggest alternative dates
              </label>
            </div>

            {suggestAlternatives && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#4d463b]">Alternative Dates</p>
                {alternativeDates.map((alt, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <input
                      type="date"
                      value={alt.date}
                      onChange={(e) => handleAlternativeChange(index, 'date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="flex-1 rounded-xl border border-[#e7dfd4] px-3 py-2 text-sm"
                    />
                    <input
                      type="time"
                      value={alt.time}
                      onChange={(e) => handleAlternativeChange(index, 'time', e.target.value)}
                      className="w-32 rounded-xl border border-[#e7dfd4] px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      value={alt.notes}
                      onChange={(e) => handleAlternativeChange(index, 'notes', e.target.value)}
                      placeholder="Notes (optional)"
                      className="flex-1 rounded-xl border border-[#e7dfd4] px-3 py-2 text-sm"
                    />
                    {alternativeDates.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAlternative(index)}
                        className="px-3 py-2 text-red-600 hover:text-red-800"
                      >
                        ✗
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddAlternative}
                  className="text-sm text-[#a87b3b] hover:text-[#8a6530] font-medium"
                >
                  + Add another date
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDecision(null)}
                className="rounded-full border border-[#e7dfd4] px-6 py-2 text-sm font-medium text-[#6f6453] transition hover:bg-[#f1e9df]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !declineReason.trim()}
                className="rounded-full bg-[#c96f3a] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#b35f30] disabled:bg-[#d9c8b5] disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        )}

        {/* Close button if no decision */}
        {!decision && (
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#e7dfd4] px-6 py-2 text-sm font-medium text-[#6f6453] transition hover:bg-[#f1e9df]"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
