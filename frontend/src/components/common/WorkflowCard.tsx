import React from 'react';
import { StatusBadge } from './StatusBadge';

export interface WorkflowCardProps {
  title: string;
  subtitle?: string;
  status: 'success' | 'warning' | 'danger' | 'info' | 'pending' | 'in-progress' | 'completed';
  assignedTo?: string;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

export function WorkflowCard({
  title,
  subtitle,
  status,
  assignedTo,
  onAction,
  actionLabel,
  className = '',
}: WorkflowCardProps) {
  return (
    <div className={`rounded-[var(--radius-lg)] bg-[var(--color-background)] p-[var(--spacing-md)] shadow-[var(--shadow-card)] border border-gray-100 dark:border-gray-800 flex flex-col gap-[var(--spacing-sm)] ${className}`}>
      <div className="flex justify-between items-start gap-4">
        <div>
          <h4 className="font-heading font-semibold text-lg">{title}</h4>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
        <StatusBadge status={status} />
      </div>
      
      {assignedTo && (
        <div className="text-sm mt-2">
          <span className="text-gray-500 dark:text-gray-400">Assigned: </span>
          <span className="font-medium">{assignedTo}</span>
        </div>
      )}

      {onAction && actionLabel && (
        <div className="mt-4 flex justify-end">
          <button 
            onClick={onAction}
            className="px-[var(--spacing-md)] py-[var(--spacing-sm)] rounded-[var(--radius-md)] bg-[var(--color-info)] text-white font-medium hover:opacity-90 transition-opacity text-sm"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
