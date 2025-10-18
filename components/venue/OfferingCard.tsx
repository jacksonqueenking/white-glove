'use client';

import { Button } from '../shared/Button';
import type { Element } from '../../lib/schemas';

interface OfferingCardProps {
  offering: Element;
  onEdit: (offering: Element) => void;
}

export function OfferingCard({ offering, onEdit }: OfferingCardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="aspect-video bg-slate-100">
        {offering.image_url ? (
          <img
            src={offering.image_url}
            alt={offering.name}
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
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">{offering.name}</h3>

        <p className="text-lg font-bold text-blue-600 mb-2">
          ${offering.price.toLocaleString()}
        </p>

        {offering.description && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-2">{offering.description}</p>
        )}

        {offering.availability_rules.lead_time_days > 0 && (
          <p className="text-xs text-slate-500 mb-3">
            Lead time: {offering.availability_rules.lead_time_days} days
          </p>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={() => onEdit(offering)}>
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
}
