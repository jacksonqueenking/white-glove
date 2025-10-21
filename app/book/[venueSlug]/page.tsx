'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { z } from 'zod';

// Form validation schema
const inquiryFormSchema = z.object({
  client_name: z.string().min(2, 'Name must be at least 2 characters'),
  client_email: z.string().email('Valid email required'),
  client_phone: z.string().regex(/^[0-9\-()+\s]+$/, 'Valid phone number required'),
  company_name: z.string().optional(),
  event_date: z.string().min(1, 'Event date is required'),
  event_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Valid time required (HH:MM)'),
  event_type: z.string().optional(),
  space_ids: z.array(z.string()).min(1, 'Please select at least one space'),
  guest_count: z.coerce.number().int().min(1, 'Guest count must be at least 1'),
  budget: z.coerce.number().min(0, 'Budget must be non-negative'),
  description: z.string().min(10, 'Please provide at least 10 characters describing your event'),
  preferred_contact_method: z.enum(['email', 'phone', 'either']).optional(),
});

type FormData = z.infer<typeof inquiryFormSchema>;
type FormErrors = Partial<Record<keyof FormData, string>>;

interface Venue {
  venue_id: string;
  name: string;
  description: string;
  address: any;
}

interface Space {
  space_id: string;
  name: string;
  description: string;
  capacity: number;
  main_image_url: string;
}

export default function BookingInquiryPage() {
  const params = useParams();
  const router = useRouter();
  const venueSlug = params.venueSlug as string;

  const [venue, setVenue] = useState<Venue | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [availabilityWarning, setAvailabilityWarning] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<FormData>({
    client_name: '',
    client_email: '',
    client_phone: '',
    company_name: '',
    event_date: '',
    event_time: '',
    event_type: '',
    space_ids: [],
    guest_count: 0,
    budget: 0,
    description: '',
    preferred_contact_method: 'either',
  });

  // Load venue and spaces
  useEffect(() => {
    async function loadVenue() {
      try {
        // TODO: Create a public API endpoint to fetch venue by slug
        // For now, we'll use the venue_id directly
        // In production, you'd want: GET /api/public/venues/[slug]

        const response = await fetch(`/api/public/venues/${venueSlug}`);
        if (!response.ok) {
          throw new Error('Venue not found');
        }

        const data = await response.json();
        setVenue(data.venue);
        setSpaces(data.spaces);
      } catch (error) {
        console.error('Error loading venue:', error);
        // TODO: Show error page
      } finally {
        setLoading(false);
      }
    }

    loadVenue();
  }, [venueSlug]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSpaceSelection = (spaceId: string) => {
    setFormData(prev => ({
      ...prev,
      space_ids: prev.space_ids.includes(spaceId)
        ? prev.space_ids.filter(id => id !== spaceId)
        : [...prev.space_ids, spaceId]
    }));
    if (errors.space_ids) {
      setErrors(prev => ({ ...prev, space_ids: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!venue) return;

    // Validate form
    const validation = inquiryFormSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: FormErrors = {};
      validation.error.errors.forEach(err => {
        const field = err.path[0] as keyof FormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          venue_id: venue.venue_id,
          source: 'website',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.details) {
          setErrors(result.details);
        } else {
          throw new Error(result.error || 'Failed to submit inquiry');
        }
        return;
      }

      // Success!
      setSubmitted(true);
      setReferenceNumber(result.reference_number);
      setAvailabilityWarning(!result.space_available);

    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading venue information...</p>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Venue Not Found</h1>
          <p className="text-gray-600">The venue you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Received!</h2>
            <p className="text-gray-600 mb-4">
              Thank you for your interest in {venue.name}!
            </p>

            {availabilityWarning && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-left">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> The selected space may not be available on your requested date.
                  The venue will review your request and contact you with alternatives if needed.
                </p>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">Your Reference Number:</p>
              <p className="text-2xl font-mono font-bold text-gray-900">{referenceNumber}</p>
            </div>

            <div className="text-left space-y-2 text-sm text-gray-600 mb-6">
              <p>✓ We've received your request for {formData.event_date}</p>
              <p>✓ You'll receive an email within 24 hours</p>
              <p>✓ If approved, you'll get a link to create your account and start planning</p>
            </div>

            <p className="text-sm text-gray-500">
              Please check your email at <strong>{formData.client_email}</strong> for updates.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{venue.name}</h1>
          <p className="text-gray-600">{venue.description}</p>
          {venue.address && (
            <p className="text-sm text-gray-500 mt-2">
              {venue.address.street}, {venue.address.city}, {venue.address.state} {venue.address.zip}
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Request to Book</h2>

          {/* Contact Information */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>

            <div>
              <label htmlFor="client_name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="client_name"
                name="client_name"
                value={formData.client_name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md ${errors.client_name ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.client_name && <p className="mt-1 text-sm text-red-600">{errors.client_name}</p>}
            </div>

            <div>
              <label htmlFor="client_email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="client_email"
                name="client_email"
                value={formData.client_email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md ${errors.client_email ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.client_email && <p className="mt-1 text-sm text-red-600">{errors.client_email}</p>}
            </div>

            <div>
              <label htmlFor="client_phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="client_phone"
                name="client_phone"
                value={formData.client_phone}
                onChange={handleInputChange}
                placeholder="(123) 456-7890"
                className={`w-full px-3 py-2 border rounded-md ${errors.client_phone ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.client_phone && <p className="mt-1 text-sm text-red-600">{errors.client_phone}</p>}
            </div>

            <div>
              <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name (Optional)
              </label>
              <input
                type="text"
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          {/* Event Details */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="event_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Event Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="event_date"
                  name="event_date"
                  value={formData.event_date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-md ${errors.event_date ? 'border-red-500' : 'border-gray-300'}`}
                  required
                />
                {errors.event_date && <p className="mt-1 text-sm text-red-600">{errors.event_date}</p>}
              </div>

              <div>
                <label htmlFor="event_time" className="block text-sm font-medium text-gray-700 mb-1">
                  Event Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  id="event_time"
                  name="event_time"
                  value={formData.event_time}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.event_time ? 'border-red-500' : 'border-gray-300'}`}
                  required
                />
                {errors.event_time && <p className="mt-1 text-sm text-red-600">{errors.event_time}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="event_type" className="block text-sm font-medium text-gray-700 mb-1">
                Event Type (Optional)
              </label>
              <select
                id="event_type"
                name="event_type"
                value={formData.event_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select event type</option>
                <option value="Wedding">Wedding</option>
                <option value="Corporate">Corporate Event</option>
                <option value="Birthday">Birthday Party</option>
                <option value="Anniversary">Anniversary</option>
                <option value="Conference">Conference</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Space(s) <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {spaces.map(space => (
                  <div
                    key={space.space_id}
                    onClick={() => handleSpaceSelection(space.space_id)}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      formData.space_ids.includes(space.space_id)
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {space.main_image_url && (
                      <img
                        src={space.main_image_url}
                        alt={space.name}
                        className="w-full h-32 object-cover rounded-md mb-2"
                      />
                    )}
                    <h4 className="font-semibold text-gray-900">{space.name}</h4>
                    <p className="text-sm text-gray-600">{space.description}</p>
                    {space.capacity && (
                      <p className="text-sm text-gray-500 mt-1">Capacity: {space.capacity} guests</p>
                    )}
                  </div>
                ))}
              </div>
              {errors.space_ids && <p className="mt-1 text-sm text-red-600">{errors.space_ids}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="guest_count" className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Guest Count <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="guest_count"
                  name="guest_count"
                  value={formData.guest_count || ''}
                  onChange={handleInputChange}
                  min="1"
                  className={`w-full px-3 py-2 border rounded-md ${errors.guest_count ? 'border-red-500' : 'border-gray-300'}`}
                  required
                />
                {errors.guest_count && <p className="mt-1 text-sm text-red-600">{errors.guest_count}</p>}
              </div>

              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                  Budget Range <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    id="budget"
                    name="budget"
                    value={formData.budget || ''}
                    onChange={handleInputChange}
                    min="0"
                    step="100"
                    className={`w-full pl-8 pr-3 py-2 border rounded-md ${errors.budget ? 'border-red-500' : 'border-gray-300'}`}
                    required
                  />
                </div>
                {errors.budget && <p className="mt-1 text-sm text-red-600">{errors.budget}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Event Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Tell us about your event, any special requirements, theme, etc."
                className={`w-full px-3 py-2 border rounded-md ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>

            <div>
              <label htmlFor="preferred_contact_method" className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Contact Method
              </label>
              <select
                id="preferred_contact_method"
                name="preferred_contact_method"
                value={formData.preferred_contact_method}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="either">Either Email or Phone</option>
                <option value="email">Email Only</option>
                <option value="phone">Phone Only</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              * Required fields
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>✓ We'll review your request within 24 hours</li>
            <li>✓ If approved, you'll receive an email with a link to create your account</li>
            <li>✓ Once your account is created, you can start planning your event with our AI assistant</li>
            <li>✓ You'll be able to customize details, manage your guest list, and coordinate with vendors</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
