import React from 'react';

type StatusType = 'success' | 'warning' | 'danger' | 'info' | 'pending' | 'in-progress' | 'completed' | 'cancelled';

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'success':
      case 'completed':
        return 'bg-[var(--color-success)] text-white';
      case 'warning':
      case 'pending':
        return 'bg-[var(--color-warning)] text-white';
      case 'danger':
      case 'cancelled':
        return 'bg-[var(--color-danger)] text-white';
      case 'info':
      case 'in-progress':
        return 'bg-[var(--color-info)] text-white';
      default:
        return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');

  return (
    <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusStyles()} ${className}`}>
      {displayLabel}
    </span>
  );
}
