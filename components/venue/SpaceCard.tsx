'use client';

import { Button } from '../shared/Button';
import type { Space } from '../../lib/schemas';

interface SpaceCardProps {
  space: Space;
  onEdit: (space: Space) => void;
}

export function SpaceCard({ space, onEdit }: SpaceCardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="aspect-video bg-slate-100">
        {space.main_image_url ? (
          <img
            src={space.main_image_url}
            alt={space.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{space.name}</h3>

        {space.capacity && (
          <p className="text-sm text-slate-600 mb-1">Capacity: {space.capacity} guests</p>
        )}

        {space.description && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-3">{space.description}</p>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={() => onEdit(space)}>
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
}
