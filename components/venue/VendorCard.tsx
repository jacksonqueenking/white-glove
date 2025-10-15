'use client';

import { Button } from '../shared/Button';

interface VendorCardProps {
  vendor: {
    vendor_id: string;
    name: string;
    approval_status: 'pending' | 'approved' | 'rejected';
    coi_expires?: string;
    offerings_count: number;
    active_events: number;
  };
}

export function VendorCard({ vendor }: VendorCardProps) {
  function getStatusBadge() {
    switch (vendor.approval_status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ✓ Approved
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            ⏳ Pending approval
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            ✗ Rejected
          </span>
        );
    }
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{vendor.name}</h3>
        {getStatusBadge()}
      </div>

      {vendor.approval_status === 'approved' && vendor.coi_expires && (
        <p className="text-sm text-slate-600 mb-2">COI expires: {vendor.coi_expires}</p>
      )}

      <div className="text-sm text-slate-600 mb-4">
        <p>{vendor.offerings_count} offerings</p>
        <p>{vendor.active_events} active events</p>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" size="sm" className="flex-1">
          View
        </Button>
        <Button variant="secondary" size="sm" className="flex-1">
          Message
        </Button>
      </div>
    </div>
  );
}
