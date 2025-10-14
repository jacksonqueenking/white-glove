'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormInput } from '@/components/forms/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { Button } from '@/components/shared/Button';

interface InvitationData {
  invitee_email: string;
  metadata: {
    vendor_name: string;
    vendor_phone: string;
    venue_id: string;
    venue_name: string;
    services: string[];
  };
}

export default function VendorRegisterPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    description: '',
  });

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch invitation details
    const fetchInvitation = async () => {
      try {
        const response = await fetch(`/api/invitations/${token}`);
        if (!response.ok) {
          throw new Error('Invalid invitation');
        }
        const data = await response.json();
        setInvitation(data);

        // Pre-fill form data from invitation
        setFormData((prev) => ({
          ...prev,
          name: data.metadata.vendor_name || '',
          email: data.invitee_email || '',
          phone: data.metadata.vendor_phone || '',
        }));
      } catch (error) {
        alert('Invalid or expired invitation link');
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvitation();
  }, [token, router]);

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.length < 3) {
      newErrors.name = 'Business name must be at least 3 characters';
    }
    if (!formData.contactName) {
      newErrors.contactName = 'Contact name is required';
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    }
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.street) newErrors.street = 'Street address is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.state || formData.state.length !== 2) {
      newErrors.state = 'Valid 2-letter state code required';
    }
    if (!formData.zip || !/^\d{5}(-\d{4})?$/.test(formData.zip)) {
      newErrors.zip = 'Valid ZIP code required';
    }
    if (!formData.description || formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/onboarding/vendor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          phone: formData.phone,
          contactName: formData.contactName,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          description: formData.description,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      router.push(result.redirect || '/vendor/dashboard');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Join EventPlatform</h1>
          <p className="text-slate-600 mt-2">
            You've been invited by <span className="font-semibold">{invitation.metadata.venue_name}</span>
          </p>
        </div>

        {/* Invitation Details */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h2 className="font-semibold text-blue-900 mb-2">Invitation Details</h2>
          <p className="text-sm text-blue-800">
            <strong>{invitation.metadata.venue_name}</strong> wants to work with you for:{' '}
            {invitation.metadata.services?.join(', ') || 'your services'}
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Business Information</h2>
            <FormInput
              label="Business Name"
              required
              value={formData.name}
              onChange={(e) => updateFormData({ name: e.target.value })}
              error={errors.name}
              placeholder="ABC Catering Co."
            />
            <FormInput
              label="Contact Name"
              required
              value={formData.contactName}
              onChange={(e) => updateFormData({ contactName: e.target.value })}
              error={errors.contactName}
              placeholder="John Smith"
            />
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => updateFormData({ email: e.target.value })}
                error={errors.email}
                placeholder="contact@business.com"
              />
              <FormInput
                label="Phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => updateFormData({ phone: e.target.value })}
                error={errors.phone}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Business Address</h2>
            <FormInput
              label="Street Address"
              required
              value={formData.street}
              onChange={(e) => updateFormData({ street: e.target.value })}
              error={errors.street}
              placeholder="123 Main Street"
            />
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="City"
                required
                value={formData.city}
                onChange={(e) => updateFormData({ city: e.target.value })}
                error={errors.city}
                placeholder="San Francisco"
              />
              <FormInput
                label="State"
                required
                value={formData.state}
                onChange={(e) => updateFormData({ state: e.target.value.toUpperCase() })}
                error={errors.state}
                placeholder="CA"
                maxLength={2}
              />
            </div>
            <FormInput
              label="ZIP Code"
              required
              value={formData.zip}
              onChange={(e) => updateFormData({ zip: e.target.value })}
              error={errors.zip}
              placeholder="94102"
            />
          </div>

          {/* Description */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">About Your Business</h2>
            <FormTextarea
              label="Description"
              required
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
              error={errors.description}
              placeholder="Tell us about your business, services, experience, and what makes you unique..."
              rows={5}
            />
          </div>

          {/* Password */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Account Security</h2>
            <FormInput
              label="Password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => updateFormData({ password: e.target.value })}
              error={errors.password}
              helperText="At least 8 characters, including uppercase, lowercase, number, and special character"
            />
            <FormInput
              label="Confirm Password"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
              error={errors.confirmPassword}
            />
          </div>

          {/* Submit */}
          <div className="pt-6 border-t border-slate-200">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </Button>
            <p className="text-xs text-slate-500 text-center mt-4">
              After creating your account, you can add your services, upload insurance documents, and start
              working with {invitation.metadata.venue_name}.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
