'use client';

/**
 * Debug Auth Page
 *
 * Temporary page to debug authentication and user lookup issues.
 * Visit /debug-auth to see detailed auth information.
 */

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DebugAuthPage() {
  const [authUser, setAuthUser] = useState<any>(null);
  const [clientData, setClientData] = useState<any>(null);
  const [venueData, setVenueData] = useState<any>(null);
  const [vendorData, setVendorData] = useState<any>(null);
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function debugAuth() {
      const supabase = createClient();

      // Get auth user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      setAuthUser({ user, error: authError });

      if (!user) {
        setLoading(false);
        return;
      }

      // Try to find user in each table
      const clientRes = await supabase
        .from('clients')
        .select('*')
        .eq('email', user.email!)
        .maybeSingle();

      const venueRes = await supabase
        .from('venues')
        .select('*')
        .eq('email', user.email!)
        .maybeSingle();

      const vendorRes = await supabase
        .from('vendors')
        .select('*')
        .eq('email', user.email!)
        .maybeSingle();

      setClientData(clientRes);
      setVenueData(venueRes);
      setVendorData(vendorRes);

      setErrors({
        client: clientRes.error,
        venue: venueRes.error,
        vendor: vendorRes.error,
      });

      setLoading(false);
    }

    debugAuth();
  }, []);

  if (loading) {
    return <div className="p-8">Loading debug info...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug</h1>

        {/* Auth User */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Auth User</h2>
          {authUser?.error ? (
            <div className="text-red-600">
              <p className="font-semibold">Error:</p>
              <pre className="bg-red-50 p-4 rounded mt-2 overflow-auto">
                {JSON.stringify(authUser.error, null, 2)}
              </pre>
            </div>
          ) : authUser?.user ? (
            <div>
              <p><strong>Email:</strong> {authUser.user.email}</p>
              <p><strong>ID:</strong> {authUser.user.id}</p>
              <p><strong>Created:</strong> {new Date(authUser.user.created_at).toLocaleString()}</p>
              <details className="mt-4">
                <summary className="cursor-pointer text-blue-600">Full user object</summary>
                <pre className="bg-gray-50 p-4 rounded mt-2 overflow-auto">
                  {JSON.stringify(authUser.user, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <p className="text-gray-600">Not authenticated</p>
          )}
        </div>

        {/* Client Data */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Client Table Lookup</h2>
          {errors.client ? (
            <div className="text-red-600">
              <p className="font-semibold">Error:</p>
              <pre className="bg-red-50 p-4 rounded mt-2 overflow-auto">
                {JSON.stringify(errors.client, null, 2)}
              </pre>
            </div>
          ) : clientData?.data ? (
            <div>
              <p className="text-green-600 font-semibold mb-2">✓ Found in clients table</p>
              <pre className="bg-gray-50 p-4 rounded overflow-auto">
                {JSON.stringify(clientData.data, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="text-gray-600">Not found in clients table</p>
          )}
        </div>

        {/* Venue Data */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Venue Table Lookup</h2>
          {errors.venue ? (
            <div className="text-red-600">
              <p className="font-semibold">Error:</p>
              <pre className="bg-red-50 p-4 rounded mt-2 overflow-auto">
                {JSON.stringify(errors.venue, null, 2)}
              </pre>
            </div>
          ) : venueData?.data ? (
            <div>
              <p className="text-green-600 font-semibold mb-2">✓ Found in venues table</p>
              <pre className="bg-gray-50 p-4 rounded overflow-auto">
                {JSON.stringify(venueData.data, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="text-gray-600">Not found in venues table</p>
          )}
        </div>

        {/* Vendor Data */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Vendor Table Lookup</h2>
          {errors.vendor ? (
            <div className="text-red-600">
              <p className="font-semibold">Error:</p>
              <pre className="bg-red-50 p-4 rounded mt-2 overflow-auto">
                {JSON.stringify(errors.vendor, null, 2)}
              </pre>
            </div>
          ) : vendorData?.data ? (
            <div>
              <p className="text-green-600 font-semibold mb-2">✓ Found in vendors table</p>
              <pre className="bg-gray-50 p-4 rounded overflow-auto">
                {JSON.stringify(vendorData.data, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="text-gray-600">Not found in vendors table</p>
          )}
        </div>

        {/* Recommendations */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">What This Means</h2>
          <ul className="space-y-2 text-sm">
            <li>• If you see errors, there may be RLS policies blocking the queries</li>
            <li>• If you're not found in any table, you haven't completed onboarding</li>
            <li>• If email doesn't match, check your auth email vs database email</li>
            <li>• This page helps diagnose why "Please log in to access chat" appears</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
