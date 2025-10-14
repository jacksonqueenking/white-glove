'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormInput } from '@/components/forms/FormInput';
import { Button } from '@/components/shared/Button';

interface InvitationData {
  invitee_email: string;
  metadata: {
    name: string;
    phone: string;
    event_id: string;
    event_date: string;
    venue_name: string;
    space_names: string[];
    guest_count: number;
  };
}

export default function ClientConfirmPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<'magic' | 'password'>('magic');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch invitation details
    const fetchInvitation = async () => {
      try {
        // You'll need to create this API endpoint
        const response = await fetch(`/api/invitations/${token}`);
        if (!response.ok) {
          throw new Error('Invalid invitation');
        }
        const data = await response.json();
        setInvitation(data);
      } catch (error) {
        alert('Invalid or expired invitation link');
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvitation();
  }, [token, router]);

  const validatePassword = () => {
    const newErrors: Record<string, string> = {};

    if (authMethod === 'password') {
      if (!password || password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/onboarding/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          authMethod,
          password: authMethod === 'password' ? password : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Confirmation failed');
      }

      if (result.method === 'magic') {
        // Show success message for magic link
        alert('Check your email for a magic link to complete your registration!');
        router.push('/');
      } else {
        // Redirect to event page
        router.push(result.redirect);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Confirmation failed');
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Booking Confirmed!</h1>
          <p className="text-slate-600 mt-2">
            Your booking at {invitation.metadata.venue_name} has been approved
          </p>
        </div>

        {/* Event Details */}
        <div className="bg-slate-50 rounded-lg p-4 mb-6 space-y-2">
          <h2 className="font-semibold text-slate-900 mb-3">Event Details</h2>
          <DetailRow label="Date" value={new Date(invitation.metadata.event_date).toLocaleDateString()} />
          <DetailRow
            label="Space"
            value={invitation.metadata.space_names.join(', ')}
          />
          <DetailRow label="Guests" value={`${invitation.metadata.guest_count} guests`} />
        </div>

        {/* Account Creation */}
        <div className="mb-6">
          <h2 className="font-semibold text-slate-900 mb-4">Complete Your Booking</h2>
          <p className="text-sm text-slate-600 mb-4">
            Create an account to manage your event, chat with your AI assistant, and track all the details.
          </p>

          {/* Auth Method Selection */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setAuthMethod('magic')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
                authMethod === 'magic'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Magic Link
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod('password')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
                authMethod === 'password'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Password
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email (read-only) */}
            <FormInput
              label="Email"
              type="email"
              value={invitation.invitee_email}
              disabled
              helperText="This email will be used for your account"
            />

            {authMethod === 'magic' ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  ✉️ We'll send you a magic link to sign in instantly, no password needed!
                </p>
              </div>
            ) : (
              <>
                <FormInput
                  label="Password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  helperText="At least 8 characters"
                />
                <FormInput
                  label="Confirm Password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={errors.confirmPassword}
                />
              </>
            )}

            {/* Terms */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                required
                className="mt-1 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
              />
              <label htmlFor="terms" className="text-xs text-slate-600">
                I agree to the Terms of Service and Privacy Policy
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Creating Account...
                </span>
              ) : authMethod === 'magic' ? (
                'Send Magic Link'
              ) : (
                'Create Account & Confirm Booking'
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Questions? Contact {invitation.metadata.venue_name} directly
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-600">{label}:</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}
