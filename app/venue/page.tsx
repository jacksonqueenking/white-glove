'use client';

import { useCurrentUser } from "../../lib/hooks/useCurrentUser";
import { VenueGeneralChat } from "../../components/chat/VenueGeneralChat";

// Venue landing page - full-screen chat interface
export default function VenueLandingPage() {
  const { user, loading } = useCurrentUser();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!user || user.type !== 'venue' || !user.venueId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-slate-600">Please log in as a venue user</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <VenueGeneralChat venueId={user.venueId} className="flex-1" />
    </div>
  );
}
