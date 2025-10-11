'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userType = (searchParams.get('type') as 'client' | 'venue' | 'vendor') || 'client';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/password?action=signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }

      // Show success message and redirect to verify
      alert('Account created! Please check your email to verify your account.');
      router.push('/login?type=' + userType);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Create Account</h1>
        <p className="text-sm text-slate-600">
          Sign up as a {userType}
        </p>
      </header>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="you@example.com"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="At least 8 characters"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
          <p className="mt-1 text-xs text-slate-500">
            Must include uppercase, lowercase, number, and special character
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="Re-enter password"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        <p className="text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link
            href={`/login?type=${userType}`}
            className="font-medium text-slate-900 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md space-y-6 text-center">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
