'use client';

import React from 'react';
import clsx from 'clsx';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusStyles: Record<string, string> = {
  // Order statuses
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  preparing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  ready: 'bg-green-50 text-green-700 border-green-200',
  served: 'bg-teal-50 text-teal-700 border-teal-200',
  completed: 'bg-gray-50 text-gray-700 border-gray-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  // Table statuses
  available: 'bg-green-50 text-green-700 border-green-200',
  occupied: 'bg-blue-50 text-blue-700 border-blue-200',
  reserved: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  maintenance: 'bg-red-50 text-red-700 border-red-200',
  // Payment statuses
  paid: 'bg-green-50 text-green-700 border-green-200',
  unpaid: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  refunded: 'bg-red-50 text-red-700 border-red-200',
  // Inventory
  critical: 'bg-red-50 text-red-700 border-red-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  low: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  // Sale status
  active: 'bg-green-50 text-green-700 border-green-200',
  true: 'bg-green-50 text-green-700 border-green-200',
  false: 'bg-gray-50 text-gray-700 border-gray-200',
};

const defaultStyle = 'bg-gray-50 text-gray-700 border-gray-200';

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
  completed: 'Completed',
  cancelled: 'Cancelled',
  available: 'Available',
  occupied: 'Occupied',
  reserved: 'Reserved',
  maintenance: 'Maintenance',
  paid: 'Paid',
  unpaid: 'Unpaid',
  refunded: 'Refunded',
  critical: 'Critical',
  high: 'High',
  low: 'Low',
  active: 'Active',
  true: 'Active',
  false: 'Inactive',
  'dine-in': 'Dine In',
  takeaway: 'Takeaway',
  delivery: 'Delivery',
  cash: 'Cash',
  card: 'Card',
  upi: 'UPI',
  online: 'Online',
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const style = statusStyles[status] || defaultStyle;
  const label = statusLabels[status] || status;

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        style
      )}
    >
      {label}
    </span>
  );
}
