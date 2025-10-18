'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userType = (searchParams.get('type') as 'client' | 'venue' | 'vendor') || 'client';
  const redirectTo = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          userType,
          redirectTo: redirectTo || `/${userType}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send magic link');
      }

      setSuccess('Check your email for the magic link!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/password?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign in');
      }

      // Handle redirect
      const userType = data.user?.user_metadata?.user_type || 'client';
      let destination = redirectTo || `/${userType}`;

      // For clients, redirect to their event page if they have exactly one event
      // If they have multiple events (or none), redirect to dashboard
      if (!redirectTo && userType === 'client') {
        try {
          const eventResponse = await fetch('/api/client/event');
          if (eventResponse.ok) {
            const eventData = await eventResponse.json();
            if (eventData.event) {
              // Client has exactly one event
              destination = `/client/event/${eventData.event.event_id}`;
            } else {
              // Client has 0 or multiple events
              destination = '/client/dashboard';
            }
          }
        } catch (err) {
          console.error('Error fetching client event:', err);
          // Fall through to default destination
        }
      }

      router.push(destination);
      router.refresh(); // Force refresh to pick up new session
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Sign In</h1>
        <p className="text-sm text-slate-600">
          Welcome back! Sign in to your account.
        </p>
      </header>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
          {success}
        </div>
      )}

      <form className="space-y-4" onSubmit={showPassword ? handlePasswordLogin : handleMagicLink}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>

        {showPassword && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
            <div className="mt-1 text-right">
              <Link
                href="/reset-password"
                className="text-xs text-slate-600 hover:text-slate-900"
              >
                Forgot password?
              </Link>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {!showPassword ? (
            <>
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>
              <button
                type="button"
                onClick={() => setShowPassword(true)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
              >
                Sign In with Password
              </button>
            </>
          ) : (
            <>
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={() => setShowPassword(false)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
              >
                Use Magic Link Instead
              </button>
            </>
          )}
        </div>

        <p className="text-center text-sm text-slate-600">
          Don't have an account?{' '}
          <Link
            href={`/signup?type=${userType}`}
            className="font-medium text-slate-900 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md space-y-6 text-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
