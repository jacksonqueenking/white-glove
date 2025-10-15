'use client';

import { useState, useEffect } from 'react';
import { Button } from '../shared/Button';
import { SpaceCard } from './SpaceCard';
import { SpaceModal } from './SpaceModal';
import { listSpaces } from '../../lib/db/spaces';
import { useCurrentUser } from '../../lib/hooks/useCurrentUser';
import { createClient } from '../../lib/supabase/client';
import type { Space } from '../../lib/schemas';

export function SpacesManager() {
  const { user, loading: userLoading } = useCurrentUser();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);

  useEffect(() => {
    if (!userLoading && user) {
      loadSpaces();
    }
  }, [userLoading, user]);

  async function loadSpaces() {
    try {
      console.log('Loading spaces, user:', user);

      if (!user || user.type !== 'venue' || !user.venueId) {
        const debugInfo = `Not authenticated as a venue. User: ${JSON.stringify({
          exists: !!user,
          type: user?.type,
          venueId: user?.venueId,
          email: user?.email
        })}`;
        console.error(debugInfo);
        setError(debugInfo);
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const spacesData = await listSpaces(supabase, user.venueId);
      setSpaces(spacesData);
    } catch (err) {
      console.error('Failed to load spaces:', err);
      setError(err instanceof Error ? err.message : 'Failed to load spaces');
    } finally {
      setLoading(false);
    }
  }

  function handleNewSpace() {
    setEditingSpace(null);
    setModalOpen(true);
  }

  function handleEditSpace(space: Space) {
    setEditingSpace(space);
    setModalOpen(true);
  }

  function handleModalClose() {
    setModalOpen(false);
    setEditingSpace(null);
  }

  function handleSpaceSaved() {
    setModalOpen(false);
    setEditingSpace(null);
    loadSpaces(); // Reload spaces after save
  }

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600">Loading spaces...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-6">
        <Button onClick={handleNewSpace}>+ New Space</Button>
      </div>

      {spaces.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No spaces yet</h3>
          <p className="text-sm text-slate-600 mb-6">
            Add your first event space to start accepting bookings.
          </p>
          <Button onClick={handleNewSpace}>+ Add Your First Space</Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => (
            <SpaceCard key={space.space_id} space={space} onEdit={handleEditSpace} />
          ))}
        </div>
      )}

      {modalOpen && user?.venueId && (
        <SpaceModal
          space={editingSpace}
          venueId={user.venueId}
          onClose={handleModalClose}
          onSaved={handleSpaceSaved}
        />
      )}
    </>
  );
}
