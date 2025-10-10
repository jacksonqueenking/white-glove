'use client';

import { useState } from 'react';

// Placeholder login form demonstrating magic link primary flow with password fallback.
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <form className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Sign In</h1>
        <p className="text-sm text-slate-600">
          Magic links are the default path per docs/authentication.md. Password entry is reserved for fallback scenarios.
        </p>
      </header>
      <label className="block text-sm font-medium text-slate-700">
        Email
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Password (optional)
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Only if required"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </label>
      <div className="space-y-2">
        <button type="button" className="w-full rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white">
          Send Magic Link
        </button>
        <button type="button" className="w-full rounded border border-slate-300 px-3 py-2 text-sm font-medium">
          Sign In with Password
        </button>
      </div>
    </form>
  );
}
