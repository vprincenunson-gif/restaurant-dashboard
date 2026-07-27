'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  color?: 'green' | 'blue' | 'yellow' | 'red' | 'purple' | 'indigo';
  onClick?: () => void;
  loading?: boolean;
}

const colorMap = {
  green: { bg: 'bg-green-50', icon: 'text-green-600', text: 'text-green-700' },
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', text: 'text-blue-700' },
  yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600', text: 'text-yellow-700' },
  red: { bg: 'bg-red-50', icon: 'text-red-600', text: 'text-red-700' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', text: 'text-purple-700' },
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', text: 'text-indigo-700' },
};

export default function StatCard({ title, value, icon: Icon, trend, color = 'green', onClick, loading }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className={clsx(
        'stat-card cursor-pointer',
        loading && 'animate-pulse'
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className={clsx('w-12 h-12 rounded-lg flex items-center justify-center', colors.bg)}>
          <Icon className={clsx('w-6 h-6', colors.icon)} />
        </div>
        {trend && (
          <span className={clsx(
            'text-xs font-medium px-2 py-1 rounded-full',
            trend.isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          )}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="stat-value">{loading ? '---' : value}</p>
        <p className="stat-label">{title}</p>
      </div>
    </div>
  );
}
